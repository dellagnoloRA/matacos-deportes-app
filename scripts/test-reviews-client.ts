import { analyzeReviewText } from "../src/lib/profanityFilter";
import {
  AUTO_REVIEW_REPORTS_THRESHOLD,
  createOrUpdateCustomerReview,
  getPublicProductReviews,
  getCustomerReviewContext,
  reportCustomerReview,
  voteReviewHelpful,
  computeProductReviewAggregates,
  type ReviewRepository,
  type StoredReviewRecord,
  type StoredReviewWithAuthor,
  type UpsertReviewParams,
  type UpsertReviewOutcome,
  type CreateReportParams,
  type CreateReportOutcome,
} from "../src/server/services/reviewService";
import type {
  ProductReviewAggregates,
  ReviewReportReason,
  ReviewStatusType,
} from "../src/types/reviews";

type TestSaleStatus = "COMPLETADA" | "PENDIENTE_PAGO" | "CANCELADA";

interface InMemoryProductRow {
  id: string;
  active: boolean;
  status: "PUBLISHED" | "DRAFT" | "SCHEDULED";
  ratingAverage: number | null;
  reviewsCount: number;
}

interface InMemoryStore {
  products: Map<string, InMemoryProductRow>;
  customers: Map<string, { id: string; name: string; email: string }>;
  sales: Array<{
    saleId: string;
    customerId: string;
    productId: string;
    status: TestSaleStatus;
    purchasedSize: string | null;
    createdAt: Date;
  }>;
  reviews: Map<string, StoredReviewRecord>;
  reports: Array<{
    id: string;
    reviewId: string;
    reporterId: string | null;
    reason: ReviewReportReason;
    comment: string | null;
    createdAt: Date;
  }>;
}

function createInMemoryReviewRepository(seed?: Partial<InMemoryStore>): {
  repo: ReviewRepository;
  store: InMemoryStore;
} {
  const store: InMemoryStore = {
    products: seed?.products ?? new Map(),
    customers: seed?.customers ?? new Map(),
    sales: seed?.sales ?? [],
    reviews: seed?.reviews ?? new Map(),
    reports: seed?.reports ?? [],
  };

  let seq = 1;

  function recalculateProduct(productId: string): ProductReviewAggregates {
    const productReviews = Array.from(store.reviews.values()).filter(
      (r) => r.productId === productId
    );
    const agg = computeProductReviewAggregates(productReviews);
    const prod = store.products.get(productId);
    if (prod) {
      prod.ratingAverage = agg.ratingAverage;
      prod.reviewsCount = agg.reviewsCount;
    }
    return agg;
  }

  const repo: ReviewRepository = {
    async productExists(productId) {
      const prod = store.products.get(productId);
      return Boolean(prod && prod.active && prod.status === "PUBLISHED");
    },
    async findVerifiedPurchase(customerId, productId) {
      const matches = store.sales
        .filter(
          (s) =>
            s.customerId === customerId &&
            s.productId === productId &&
            s.status === "COMPLETADA"
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const latest = matches[0];
      return latest
        ? { saleId: latest.saleId, purchasedSize: latest.purchasedSize }
        : null;
    },
    async findCustomerReview(customerId, productId) {
      return (
        Array.from(store.reviews.values()).find(
          (r) => r.customerId === customerId && r.productId === productId
        ) ?? null
      );
    },
    async upsertReviewAndRecalculate(
      params: UpsertReviewParams
    ): Promise<UpsertReviewOutcome> {
      const existing = Array.from(store.reviews.values()).find(
        (r) => r.customerId === params.customerId && r.productId === params.productId
      );
      if (existing && existing.status === "OCULTA") {
        return {
          ok: false,
          error:
            "Esta reseña fue moderada por el equipo de Matacos Deportes y no puede editarse.",
        };
      }

      const lockedByReports =
        existing !== undefined &&
        existing.status === "EN_REVISION" &&
        existing.reportsCount >= AUTO_REVIEW_REPORTS_THRESHOLD;

      const effectiveStatus: ReviewStatusType = lockedByReports
        ? "EN_REVISION"
        : params.status;
      const effectiveReason = lockedByReports
        ? existing.moderationReason ??
          "Retenida automáticamente tras alcanzar 3 reportes de usuarios."
        : params.moderationReason;

      const now = new Date(Date.now() + seq++);
      let record: StoredReviewRecord;
      if (existing) {
        record = {
          ...existing,
          rating: params.rating,
          title: params.title,
          comment: params.comment,
          purchasedSize: params.purchasedSize,
          fitFeedback: params.fitFeedback,
          isVerifiedPurchase: params.isVerifiedPurchase,
          saleId: params.saleId,
          status: effectiveStatus,
          moderationReason: effectiveReason,
          updatedAt: now,
        };
      } else {
        record = {
          id: `rev-${seq++}`,
          productId: params.productId,
          customerId: params.customerId,
          rating: params.rating,
          title: params.title,
          comment: params.comment,
          purchasedSize: params.purchasedSize,
          fitFeedback: params.fitFeedback,
          isVerifiedPurchase: params.isVerifiedPurchase,
          saleId: params.saleId,
          status: effectiveStatus,
          moderationReason: effectiveReason,
          adminResponse: null,
          adminResponseAt: null,
          adminResponderId: null,
          reportsCount: 0,
          helpfulVotes: 0,
          createdAt: now,
          updatedAt: now,
        };
      }
      store.reviews.set(record.id, record);
      const aggregates = recalculateProduct(params.productId);
      return {
        ok: true,
        review: record,
        aggregates,
        wasUpdated: Boolean(existing),
      };
    },
    async listPublishedReviewsForProduct(productId): Promise<StoredReviewWithAuthor[]> {
      return Array.from(store.reviews.values())
        .filter((r) => r.productId === productId && r.status === "PUBLICADA")
        .map((r) => ({
          ...r,
          customerName: store.customers.get(r.customerId)?.name ?? "Cliente",
        }));
    },
    async findReviewById(reviewId) {
      return store.reviews.get(reviewId) ?? null;
    },
    async createReportAndUpdateReview(
      params: CreateReportParams
    ): Promise<CreateReportOutcome> {
      const rev = store.reviews.get(params.reviewId);
      if (!rev || rev.status !== "PUBLICADA") {
        return {
          ok: false,
          error: "La reseña no está disponible o ya se encuentra bajo moderación.",
        };
      }

      if (params.reporterId && params.reporterId === rev.customerId) {
        return {
          ok: false,
          error: "No podés reportar tu propia reseña.",
        };
      }

      if (
        params.reporterId &&
        store.reports.some(
          (rep) => rep.reviewId === params.reviewId && rep.reporterId === params.reporterId
        )
      ) {
        return {
          ok: false,
          error: "Ya reportaste esta reseña anteriormente.",
        };
      }

      store.reports.push({
        id: `rep-${seq++}`,
        reviewId: params.reviewId,
        reporterId: params.reporterId,
        reason: params.reason,
        comment: params.comment,
        createdAt: new Date(),
      });

      const previousStatus = rev.status;
      rev.reportsCount += 1;
      const movedToModeration =
        rev.reportsCount >= params.autoReviewThreshold && previousStatus === "PUBLICADA";

      if (movedToModeration) {
        rev.status = "EN_REVISION";
        rev.moderationReason =
          "Retenida automáticamente tras alcanzar 3 reportes de usuarios.";
      }
      rev.updatedAt = new Date();
      store.reviews.set(rev.id, rev);
      const aggregates = recalculateProduct(rev.productId);
      return {
        ok: true,
        productId: rev.productId,
        reportsCount: rev.reportsCount,
        status: rev.status,
        movedToModeration,
        aggregates,
      };
    },
    async incrementHelpfulVotes(reviewId) {
      const rev = store.reviews.get(reviewId);
      if (!rev) return null;
      rev.helpfulVotes += 1;
      store.reviews.set(rev.id, rev);
      return { productId: rev.productId, helpfulVotes: rev.helpfulVotes };
    },
  };

  return { repo, store };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

async function runTests(): Promise<void> {
  console.log("=== TDD Suite: Reseñas de Clientes ===");

  // Slice 1: Texto limpio deportivo sin falsos positivos vs insulto grave
  {
    const cleanSports = analyzeReviewText(
      "Excelente pelota de voley para disputa en cancha cubierta. Buena reputacion y gran agarre."
    );
    assert(
      cleanSports.status === "CLEAN" && cleanSports.flaggedTerms.length === 0,
      "Slice 1a: texto deportivo sin falsos positivos (disputa, reputacion, pelota) es CLEAN",
      JSON.stringify(cleanSports)
    );

    const blockedDirect = analyzeReviewText(
      "Estas zapatillas son una mierda, no sirven para nada"
    );
    assert(
      blockedDirect.status === "BLOCKED" && blockedDirect.flaggedTerms.length > 0,
      "Slice 1b: insulto directo devuelve BLOCKED con terminos detectados",
      JSON.stringify(blockedDirect)
    );
  }

  // Slice 2: Normalizacion tildes/leetspeak/letras repetidas + URLs/email/telefono (sin falsos positivos en fechas)
  {
    const leetBlocked = analyzeReviewText("Unos b0ludooo0s, me vendieron algo roto p3l0tud0");
    assert(
      leetBlocked.status === "BLOCKED",
      "Slice 2a: leetspeak y letras repetidas son detectados como BLOCKED",
      JSON.stringify(leetBlocked)
    );

    const accentBlocked = analyzeReviewText("Me trataron como un imbécil en el chat");
    assert(
      accentBlocked.status === "BLOCKED",
      "Slice 2b: tildes normalizadas detectan BLOCKED",
      JSON.stringify(accentBlocked)
    );

    const urlReview = analyzeReviewText(
      "Las compré más baratas en https://otro-sitio-spam.com/oferta mirá"
    );
    assert(
      urlReview.status === "REVIEW",
      "Slice 2c: enlace externo envia a REVIEW",
      JSON.stringify(urlReview)
    );

    const contactReview = analyzeReviewText(
      "Escribime por WhatsApp al 3704-556677 o a promo@reventa.com.ar"
    );
    assert(
      contactReview.status === "REVIEW",
      "Slice 2d: telefono o email expuesto envia a REVIEW",
      JSON.stringify(contactReview)
    );

    const combinedBlocked = analyzeReviewText(
      "Son unos garcas miren https://ejemplo.com"
    );
    assert(
      combinedBlocked.status === "BLOCKED",
      "Slice 2e: si mezcla BLOCKED y REVIEW, prevalece BLOCKED",
      JSON.stringify(combinedBlocked)
    );

    const safeNumberClean = analyzeReviewText(
      "Talle 42 espectacular, las recibi el 25-11-2026 y pesan 290 gramos"
    );
    assert(
      safeNumberClean.status === "CLEAN",
      "Slice 2f: numeros normales y fechas con guiones (25-11-2026) no disparan REVIEW",
      JSON.stringify(safeNumberClean)
    );
  }

  // Slice 3: Autenticacion obligatoria y validacion Zod en createOrUpdateCustomerReview
  {
    const unauthRes = await createOrUpdateCustomerReview(null, {
      productId: "prod-1",
      rating: 5,
      title: "Excelente calce",
      comment: "Muy buenas zapatillas para jugar al voley todos los dias.",
    });
    assert(
      !unauthRes.success && Boolean(unauthRes.error),
      "Slice 3a: rechaza cliente no autenticado",
      JSON.stringify(unauthRes)
    );

    const invalidRatingRes = await createOrUpdateCustomerReview(
      { customerId: "cust-1", name: "Juan Pérez", email: "juan@test.com" },
      {
        productId: "prod-1",
        rating: 6,
        title: "Ok",
        comment: "Corta",
      }
    );
    assert(
      !invalidRatingRes.success && Boolean(invalidRatingRes.error),
      "Slice 3b: rechaza payload invalido por Zod (rating fuera de rango y textos cortos)",
      JSON.stringify(invalidRatingRes)
    );
  }

  // Slice 4: Comprador verificado publica con isVerifiedPurchase=true, saleId y talle autodetectado
  {
    const { repo, store } = createInMemoryReviewRepository({
      products: new Map([
        [
          "prod-asics",
          { id: "prod-asics", active: true, status: "PUBLISHED", ratingAverage: null, reviewsCount: 0 },
        ],
        [
          "prod-draft",
          { id: "prod-draft", active: true, status: "DRAFT", ratingAverage: null, reviewsCount: 0 },
        ],
      ]),
      customers: new Map([
        ["cust-verified", { id: "cust-verified", name: "Nahir Fornari", email: "nahir@matacos.test" }],
      ]),
      sales: [
        {
          saleId: "sale-100",
          customerId: "cust-verified",
          productId: "prod-asics",
          status: "COMPLETADA",
          purchasedSize: "42",
          createdAt: new Date("2026-11-20T14:00:00Z"),
        },
      ],
    });

    const res = await createOrUpdateCustomerReview(
      { customerId: "cust-verified", name: "Nahir Fornari", email: "nahir@matacos.test" },
      {
        productId: "prod-asics",
        rating: 5,
        title: "Impecables para voley",
        comment: "Muy comodas desde el primer partido, el agarre en cancha es excelente.",
        fitFeedback: "EXACTO",
      },
      repo
    );

    assert(
      res.success === true &&
        res.data?.productId === "prod-asics" &&
        res.data.status === "PUBLICADA" &&
        res.data.isVerifiedPurchase === true &&
        res.data.purchasedSize === "42" &&
        res.data.ratingAverage === 5 &&
        res.data.reviewsCount === 1 &&
        store.products.get("prod-asics")?.reviewsCount === 1,
      "Slice 4a: comprador verificado publica PUBLICADA, hereda talle 42 y actualiza promedio",
      JSON.stringify(res)
    );

    const draftRes = await createOrUpdateCustomerReview(
      { customerId: "cust-verified", name: "Nahir Fornari", email: "nahir@matacos.test" },
      {
        productId: "prod-draft",
        rating: 5,
        title: "Producto borrador",
        comment: "No deberia poderse reseñar un producto en borrador o inactivo.",
      },
      repo
    );
    assert(
      !draftRes.success && draftRes.error === "El producto indicado no existe o no está publicado.",
      "Slice 4b: impide reseñar productos inactivos o en estado DRAFT",
      JSON.stringify(draftRes)
    );
  }

  // Slice 5: Cliente sin compra + filtro BLOCKED no persiste + REVIEW guarda EN_REVISION con motivo
  {
    const { repo, store } = createInMemoryReviewRepository({
      products: new Map([
        [
          "prod-short",
          { id: "prod-short", active: true, status: "PUBLISHED", ratingAverage: null, reviewsCount: 0 },
        ],
      ]),
      customers: new Map([
        ["cust-a", { id: "cust-a", name: "Agustin D.", email: "agus@matacos.test" }],
        ["cust-b", { id: "cust-b", name: "Eugenia G.", email: "euge@matacos.test" }],
        ["cust-c", { id: "cust-c", name: "Carlos R.", email: "carlos@matacos.test" }],
      ]),
    });

    const resUnverified = await createOrUpdateCustomerReview(
      { customerId: "cust-a", name: "Agustin D.", email: "agus@matacos.test" },
      {
        productId: "prod-short",
        rating: 4,
        title: "Buen calce deportivo",
        comment: "Lo probe en el local y la tela respirable es excelente para verano.",
        purchasedSize: "L",
        fitFeedback: "EXACTO",
      },
      repo
    );
    assert(
      resUnverified.success === true &&
        resUnverified.data?.isVerifiedPurchase === false &&
        resUnverified.data.purchasedSize === "L" &&
        resUnverified.data.status === "PUBLICADA" &&
        resUnverified.data.ratingAverage === 4 &&
        resUnverified.data.reviewsCount === 1,
      "Slice 5a: cliente registrado sin compra publica con isVerifiedPurchase=false y talle manual L",
      JSON.stringify(resUnverified)
    );

    const resBlocked = await createOrUpdateCustomerReview(
      { customerId: "cust-b", name: "Eugenia G.", email: "euge@matacos.test" },
      {
        productId: "prod-short",
        rating: 1,
        title: "Una mierda total",
        comment: "Son unos estafadores totales no compren aca nunca mas.",
      },
      repo
    );
    assert(
      !resBlocked.success &&
        resBlocked.error ===
          "Por favor, utilizá un lenguaje adecuado para compartir tu experiencia." &&
        store.reviews.size === 1,
      "Slice 5b: texto BLOCKED rechaza sin persistir en BD",
      JSON.stringify(resBlocked)
    );

    const resReviewQueue = await createOrUpdateCustomerReview(
      { customerId: "cust-c", name: "Carlos R.", email: "carlos@matacos.test" },
      {
        productId: "prod-short",
        rating: 5,
        title: "Promo en mi web",
        comment: "Miren el catalogo completo en https://spam-tienda.com o al 3704-998877.",
      },
      repo
    );
    const savedQueueReview = store.reviews.get(resReviewQueue.data?.reviewId ?? "");
    assert(
      resReviewQueue.success === true &&
        resReviewQueue.data?.status === "EN_REVISION" &&
        Boolean(savedQueueReview?.moderationReason) &&
        resReviewQueue.data.ratingAverage === 4 &&
        resReviewQueue.data.reviewsCount === 1 &&
        store.products.get("prod-short")?.reviewsCount === 1,
      "Slice 5c: texto REVIEW guarda EN_REVISION con moderationReason sin alterar promedio publicado",
      JSON.stringify({ resReviewQueue, moderationReason: savedQueueReview?.moderationReason })
    );
  }

  // Slice 6: 1 reseña por cliente/producto, bloqueo si OCULTA y anti-bypass si fue retenida por reportes
  {
    const { repo, store } = createInMemoryReviewRepository({
      products: new Map([
        [
          "prod-malla",
          { id: "prod-malla", active: true, status: "PUBLISHED", ratingAverage: null, reviewsCount: 0 },
        ],
      ]),
      customers: new Map([
        ["cust-1", { id: "cust-1", name: "Lourdes B.", email: "lourdes@matacos.test" }],
        ["cust-2", { id: "cust-2", name: "Ricardo D.", email: "ricardo@matacos.test" }],
        ["cust-3", { id: "cust-3", name: "Martin G.", email: "martin@matacos.test" }],
      ]),
    });

    const firstPost = await createOrUpdateCustomerReview(
      { customerId: "cust-1", name: "Lourdes B.", email: "lourdes@matacos.test" },
      {
        productId: "prod-malla",
        rating: 3,
        title: "Buena tela",
        comment: "Buen material para pileta, pero la senti algo ajustada al principio.",
        purchasedSize: "M",
        fitFeedback: "CHICO",
      },
      repo
    );

    const secondPost = await createOrUpdateCustomerReview(
      { customerId: "cust-1", name: "Lourdes B.", email: "lourdes@matacos.test" },
      {
        productId: "prod-malla",
        rating: 5,
        title: "Excelente luego del uso",
        comment: "Con el segundo entrenamiento cedio un punto y el calce quedo perfecto.",
        purchasedSize: "M",
        fitFeedback: "EXACTO",
      },
      repo
    );

    assert(
      firstPost.success &&
        secondPost.success &&
        secondPost.data?.wasUpdated === true &&
        secondPost.data.reviewsCount === 1 &&
        secondPost.data.ratingAverage === 5 &&
        store.reviews.size === 1,
      "Slice 6a: re-envio del mismo cliente actualiza su reseña unica y recalcula promedio",
      JSON.stringify(secondPost)
    );

    store.reviews.set("rev-hidden", {
      id: "rev-hidden",
      productId: "prod-malla",
      customerId: "cust-2",
      rating: 2,
      title: "Oculta",
      comment: "Reseña ocultada por moderacion previa.",
      purchasedSize: "L",
      fitFeedback: "EXACTO",
      isVerifiedPurchase: false,
      saleId: null,
      status: "OCULTA",
      moderationReason: "Contenido fuera de normas",
      adminResponse: null,
      adminResponseAt: null,
      adminResponderId: null,
      reportsCount: 2,
      helpfulVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const editHiddenRes = await createOrUpdateCustomerReview(
      { customerId: "cust-2", name: "Ricardo D.", email: "ricardo@matacos.test" },
      {
        productId: "prod-malla",
        rating: 5,
        title: "Intento de edicion",
        comment: "Quiero cambiar mi reseña aunque fue moderada por el admin.",
      },
      repo
    );
    assert(
      !editHiddenRes.success &&
        editHiddenRes.error ===
          "Esta reseña fue moderada por el equipo de Matacos Deportes y no puede editarse.",
      "Slice 6b: reseña OCULTA por moderacion no puede ser editada por el cliente",
      JSON.stringify(editHiddenRes)
    );

    store.reviews.set("rev-reported-queue", {
      id: "rev-reported-queue",
      productId: "prod-malla",
      customerId: "cust-3",
      rating: 1,
      title: "En revision por reportes",
      comment: "Texto reportado 3 veces por la comunidad.",
      purchasedSize: "L",
      fitFeedback: "CHICO",
      isVerifiedPurchase: false,
      saleId: null,
      status: "EN_REVISION",
      moderationReason: "Retenida por reportes",
      adminResponse: null,
      adminResponseAt: null,
      adminResponderId: null,
      reportsCount: 3,
      helpfulVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const bypassEditRes = await createOrUpdateCustomerReview(
      { customerId: "cust-3", name: "Martin G.", email: "martin@matacos.test" },
      {
        productId: "prod-malla",
        rating: 5,
        title: "Texto limpio para volver",
        comment: "Edito con texto limpio intentando autopublicar sin revision del admin.",
      },
      repo
    );
    assert(
      bypassEditRes.success === true && bypassEditRes.data?.status === "EN_REVISION",
      "Slice 6c: reseña retenida por >=3 reportes permanece EN_REVISION aunque el autor la edite limpia",
      JSON.stringify(bypassEditRes)
    );
  }

  // Slice 7: getPublicProductReviews y getCustomerReviewContext
  {
    const { repo, store } = createInMemoryReviewRepository({
      products: new Map([
        [
          "prod-voley",
          { id: "prod-voley", active: true, status: "PUBLISHED", ratingAverage: null, reviewsCount: 0 },
        ],
      ]),
      customers: new Map([
        ["c1", { id: "c1", name: "Juan Pérez", email: "c1@test.com" }],
        ["c2", { id: "c2", name: "María Gómez", email: "c2@test.com" }],
        ["c3", { id: "c3", name: "Samy", email: "c3@test.com" }],
        ["c4", { id: "c4", name: "Usuario Oculto", email: "c4@test.com" }],
      ]),
      sales: [
        {
          saleId: "sale-v1",
          customerId: "c1",
          productId: "prod-voley",
          status: "COMPLETADA",
          purchasedSize: "41",
          createdAt: new Date("2026-11-10T10:00:00Z"),
        },
      ],
    });

    store.reviews.set("r1", {
      id: "r1",
      productId: "prod-voley",
      customerId: "c1",
      rating: 5,
      title: "Excelente agarre",
      comment: "Las uso en parquet y no resbalan nada.",
      purchasedSize: "41",
      fitFeedback: "EXACTO",
      isVerifiedPurchase: true,
      saleId: "sale-v1",
      status: "PUBLICADA",
      moderationReason: null,
      adminResponse: "¡Gracias por elegirnos! Te esperamos en Saavedra 241.",
      adminResponseAt: new Date("2026-11-21T15:00:00Z"),
      adminResponderId: "admin-user-1",
      reportsCount: 0,
      helpfulVotes: 2,
      createdAt: new Date("2026-11-20T12:00:00Z"),
      updatedAt: new Date("2026-11-20T12:00:00Z"),
    });

    store.reviews.set("r2", {
      id: "r2",
      productId: "prod-voley",
      customerId: "c2",
      rating: 4,
      title: "Comodas pero un poco justas",
      comment: "Conviene revisar bien los centimetros en la tabla.",
      purchasedSize: "39",
      fitFeedback: "CHICO",
      isVerifiedPurchase: false,
      saleId: null,
      status: "PUBLICADA",
      moderationReason: null,
      adminResponse: null,
      adminResponseAt: null,
      adminResponderId: null,
      reportsCount: 0,
      helpfulVotes: 0,
      createdAt: new Date("2026-11-22T12:00:00Z"),
      updatedAt: new Date("2026-11-22T12:00:00Z"),
    });

    store.reviews.set("r3", {
      id: "r3",
      productId: "prod-voley",
      customerId: "c3",
      rating: 5,
      title: "Super livianas",
      comment: "Geniales para entrenar todos los dias.",
      purchasedSize: "40",
      fitFeedback: "EXACTO",
      isVerifiedPurchase: false,
      saleId: null,
      status: "PUBLICADA",
      moderationReason: null,
      adminResponse: null,
      adminResponseAt: null,
      adminResponderId: null,
      reportsCount: 0,
      helpfulVotes: 0,
      createdAt: new Date("2026-11-18T12:00:00Z"),
      updatedAt: new Date("2026-11-18T12:00:00Z"),
    });

    store.reviews.set("r4-hidden", {
      id: "r4-hidden",
      productId: "prod-voley",
      customerId: "c4",
      rating: 1,
      title: "Spam oculto",
      comment: "Este comentario esta oculto y no debe aparecer.",
      purchasedSize: null,
      fitFeedback: null,
      isVerifiedPurchase: false,
      saleId: null,
      status: "OCULTA",
      moderationReason: "Spam",
      adminResponse: null,
      adminResponseAt: null,
      adminResponderId: null,
      reportsCount: 4,
      helpfulVotes: 0,
      createdAt: new Date("2026-11-23T12:00:00Z"),
      updatedAt: new Date("2026-11-23T12:00:00Z"),
    });

    const listAll = await getPublicProductReviews({ productId: "prod-voley" }, repo);
    assert(
      listAll.success === true &&
        listAll.data?.summary.reviewsCount === 3 &&
        listAll.data.summary.ratingAverage === 4.67 &&
        listAll.data.summary.starDistribution[5] === 2 &&
        listAll.data.summary.starDistribution[4] === 1 &&
        listAll.data.summary.fitSummary.totalResponses === 3 &&
        listAll.data.summary.fitSummary.exactoPct === 67 &&
        listAll.data.summary.fitSummary.chicoPct === 33 &&
        listAll.data.reviews.length === 3 &&
        listAll.data.reviews[0]?.id === "r2" &&
        listAll.data.reviews.find((r) => r.id === "r1")?.authorDisplayName === "Juan P." &&
        listAll.data.reviews.find((r) => r.id === "r1")?.adminReply?.authorName === "Matacos Deportes",
      "Slice 7a: lista solo PUBLICADA, calcula resumen/calce, orden reciente, nombre corto y firma Matacos Deportes",
      JSON.stringify(listAll)
    );

    const listFiltered = await getPublicProductReviews(
      { productId: "prod-voley", starFilter: 5, onlyVerified: true, sort: "rating_high" },
      repo
    );
    assert(
      listFiltered.success === true &&
        listFiltered.data?.reviews.length === 1 &&
        listFiltered.data.reviews[0]?.id === "r1" &&
        listFiltered.data.summary.reviewsCount === 3,
      "Slice 7b: filtros starFilter + onlyVerified filtran la lista pero conservan el resumen total",
      JSON.stringify(listFiltered)
    );

    const listLowSort = await getPublicProductReviews(
      { productId: "prod-voley", sort: "rating_low" },
      repo
    );
    assert(
      listLowSort.success === true && listLowSort.data?.reviews[0]?.id === "r2",
      "Slice 7c: sort rating_low ordena menor calificacion primero",
      JSON.stringify(listLowSort)
    );

    const ctxAnon = await getCustomerReviewContext(null, "prod-voley", repo);
    const ctxVerified = await getCustomerReviewContext(
      { customerId: "c1", name: "Juan Pérez", email: "c1@test.com" },
      "prod-voley",
      repo
    );
    assert(
      ctxAnon.isAuthenticated === false &&
        ctxVerified.isAuthenticated === true &&
        ctxVerified.hasVerifiedPurchase === true &&
        ctxVerified.verifiedPurchasedSize === "41" &&
        ctxVerified.existingReview?.id === "r1",
      "Slice 7d: getCustomerReviewContext detecta sesion anonima y contexto de comprador verificado",
      JSON.stringify({ ctxAnon, ctxVerified })
    );
  }

  // Slice 8: reportCustomerReview y voteReviewHelpful
  {
    const { repo, store } = createInMemoryReviewRepository({
      products: new Map([
        [
          "prod-remera",
          { id: "prod-remera", active: true, status: "PUBLISHED", ratingAverage: 5, reviewsCount: 1 },
        ],
      ]),
      customers: new Map([
        ["autor", { id: "autor", name: "Autor Test", email: "autor@test.com" }],
        ["rep1", { id: "rep1", name: "Usuario 1", email: "u1@test.com" }],
        ["rep2", { id: "rep2", name: "Usuario 2", email: "u2@test.com" }],
        ["rep3", { id: "rep3", name: "Usuario 3", email: "u3@test.com" }],
      ]),
    });

    store.reviews.set("rev-rep", {
      id: "rev-rep",
      productId: "prod-remera",
      customerId: "autor",
      rating: 5,
      title: "Opinión pública",
      comment: "Texto inicial de prueba para validar reportes y votos utiles.",
      purchasedSize: "M",
      fitFeedback: "EXACTO",
      isVerifiedPurchase: false,
      saleId: null,
      status: "PUBLICADA",
      moderationReason: null,
      adminResponse: null,
      adminResponseAt: null,
      adminResponderId: null,
      reportsCount: 0,
      helpfulVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const selfReport = await reportCustomerReview(
      { customerId: "autor", name: "Autor Test", email: "autor@test.com" },
      { reviewId: "rev-rep", reason: "SPAM" },
      repo
    );
    assert(
      !selfReport.success && selfReport.error === "No podés reportar tu propia reseña.",
      "Slice 8a: impide auto-reporte del autor",
      JSON.stringify(selfReport)
    );

    const voteRes = await voteReviewHelpful("rev-rep", repo);
    assert(
      voteRes.success === true &&
        voteRes.data?.helpfulVotes === 1 &&
        voteRes.data.productId === "prod-remera",
      "Slice 8b: voteReviewHelpful incrementa votos utiles y retorna productId",
      JSON.stringify(voteRes)
    );

    const r1 = await reportCustomerReview(
      { customerId: "rep1", name: "Usuario 1", email: "u1@test.com" },
      { reviewId: "rev-rep", reason: "SPAM" },
      repo
    );
    const dupReport = await reportCustomerReview(
      { customerId: "rep1", name: "Usuario 1", email: "u1@test.com" },
      { reviewId: "rev-rep", reason: "SPAM" },
      repo
    );
    assert(
      r1.success === true &&
        r1.data?.status === "PUBLICADA" &&
        !dupReport.success &&
        dupReport.error === "Ya reportaste esta reseña anteriormente.",
      "Slice 8c: permite primer reporte e impide reporte duplicado del mismo cliente",
      JSON.stringify({ r1, dupReport })
    );

    const r2 = await reportCustomerReview(
      { customerId: "rep2", name: "Usuario 2", email: "u2@test.com" },
      { reviewId: "rev-rep", reason: "LENGUAJE_INAPROPIADO" },
      repo
    );
    const r3 = await reportCustomerReview(
      { customerId: "rep3", name: "Usuario 3", email: "u3@test.com" },
      { reviewId: "rev-rep", reason: "INFORMACION_FALSA" },
      repo
    );
    assert(
      r2.success === true &&
        r2.data?.reportsCount === 2 &&
        r2.data.status === "PUBLICADA" &&
        r3.success === true &&
        r3.data?.reportsCount === 3 &&
        r3.data.movedToModeration === true &&
        r3.data.status === "EN_REVISION" &&
        store.products.get("prod-remera")?.reviewsCount === 0 &&
        store.products.get("prod-remera")?.ratingAverage === null &&
        Boolean(store.reviews.get("rev-rep")?.moderationReason),
      "Slice 8d: al 3er reporte pasa a EN_REVISION con motivo y recalcula promedio/conteo",
      JSON.stringify({ r2, r3 })
    );
  }

  console.log(`\nResumen: ${passed} pasaron, ${failed} fallaron.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Error fatal en suite TDD:", err);
  process.exit(1);
});
