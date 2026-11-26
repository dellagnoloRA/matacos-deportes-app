import {
  REVIEWS_MODERATION_PERMISSION,
  verifyReviewsModerationAccess,
  listAdminReviews,
  respondToCustomerReview,
  moderateCustomerReview,
  type AdminReviewRepository,
  type AdminStaffActorRecord,
  type StoredAdminReviewRecord,
  type SaveAdminResponseOutcome,
  type ModerateReviewOutcome,
} from "../src/server/services/adminReviewService";
import { computeProductReviewAggregates } from "../src/server/services/reviewService";
import {
  STORE_PUBLIC_SIGNATURE,
  type AdminReviewsCounters,
  type AdminReviewTab,
} from "../src/types/reviews";

interface InMemoryAdminStore {
  staff: Map<string, AdminStaffActorRecord>;
  products: Map<
    string,
    {
      id: string;
      name: string;
      imageUrl: string | null;
      ratingAverage: number | null;
      reviewsCount: number;
    }
  >;
  reviews: Map<string, StoredAdminReviewRecord>;
}

function makeReviewFixture(
  overrides: Partial<StoredAdminReviewRecord> & { id: string }
): StoredAdminReviewRecord {
  const baseDate = new Date("2026-11-22T12:00:00Z");
  return {
    productId: "p-1",
    productName: "Zapatillas Asics Gel-Rocket",
    productImageUrl: null,
    customerId: "c-1",
    customerName: "Juan Pérez",
    customerEmail: "juan@test.com",
    rating: 5,
    title: "Excelentes",
    comment: "Super cómodas para voley indoor.",
    purchasedSize: "42",
    fitFeedback: "EXACTO",
    isVerifiedPurchase: true,
    status: "PUBLICADA",
    moderationReason: null,
    reportsCount: 0,
    helpfulVotes: 0,
    reports: [],
    adminResponse: null,
    adminResponseAt: null,
    adminResponderId: null,
    adminResponderName: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

function createInMemoryAdminReviewRepository(seed?: Partial<InMemoryAdminStore>): {
  repo: AdminReviewRepository;
  store: InMemoryAdminStore;
} {
  const store: InMemoryAdminStore = {
    staff: seed?.staff ?? new Map(),
    products: seed?.products ?? new Map(),
    reviews: seed?.reviews ?? new Map(),
  };

  function matchesPendingOrReported(r: StoredAdminReviewRecord): boolean {
    return r.status !== "OCULTA" && (r.status === "EN_REVISION" || r.reportsCount > 0);
  }

  function matchesUnanswered(r: StoredAdminReviewRecord): boolean {
    return (
      r.status === "PUBLICADA" &&
      (!r.adminResponse || r.adminResponse.trim().length === 0)
    );
  }

  function computeCounters(): AdminReviewsCounters {
    const allReviews = Array.from(store.reviews.values());
    return {
      all: allReviews.length,
      pendingOrReported: allReviews.filter(matchesPendingOrReported).length,
      unanswered: allReviews.filter(matchesUnanswered).length,
      hidden: allReviews.filter((r) => r.status === "OCULTA").length,
    };
  }

  const repo: AdminReviewRepository = {
    async findStaffActor(userId: string) {
      return store.staff.get(userId) ?? null;
    },
    async queryAdminReviews(filter: {
      tab: AdminReviewTab;
      productId: string | null;
      search: string | null;
      page: number;
      pageSize: number;
    }) {
      const counters = computeCounters();
      let list = Array.from(store.reviews.values());

      if (filter.tab === "PENDING_REPORTED") {
        list = list.filter(matchesPendingOrReported);
      } else if (filter.tab === "UNANSWERED") {
        list = list.filter(matchesUnanswered);
      } else if (filter.tab === "HIDDEN") {
        list = list.filter((r) => r.status === "OCULTA");
      }

      if (filter.productId) {
        list = list.filter((r) => r.productId === filter.productId);
      }

      if (filter.search) {
        const needle = filter.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.productName.toLowerCase().includes(needle) ||
            r.customerName.toLowerCase().includes(needle) ||
            r.customerEmail.toLowerCase().includes(needle) ||
            r.title.toLowerCase().includes(needle) ||
            r.comment.toLowerCase().includes(needle)
        );
      }

      list.sort((a, b) => {
        if (filter.tab === "PENDING_REPORTED") {
          return (
            b.reportsCount - a.reportsCount ||
            b.createdAt.getTime() - a.createdAt.getTime()
          );
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const totalFiltered = list.length;
      const start = (filter.page - 1) * filter.pageSize;
      const items = list.slice(start, start + filter.pageSize);
      return { items, totalFiltered, counters };
    },
    async saveAdminResponse(params): Promise<SaveAdminResponseOutcome> {
      const rev = store.reviews.get(params.reviewId);
      if (!rev) {
        return { ok: false, error: "La reseña indicada no existe." };
      }
      const staff = store.staff.get(params.responderId);
      const now = new Date();
      rev.adminResponse = params.response;
      rev.adminResponseAt = now;
      rev.adminResponderId = params.responderId;
      rev.adminResponderName = staff?.name ?? null;
      store.reviews.set(rev.id, rev);
      return {
        ok: true,
        reviewId: rev.id,
        productId: rev.productId,
        adminResponse: params.response,
        adminResponseAt: now,
        responderName: rev.adminResponderName,
      };
    },
    async updateReviewModeration(params): Promise<ModerateReviewOutcome> {
      const rev = store.reviews.get(params.reviewId);
      if (!rev) {
        return { ok: false, error: "La reseña indicada no existe." };
      }
      rev.status = params.status;
      rev.moderationReason =
        params.status === "PUBLICADA"
          ? null
          : params.reason ?? rev.moderationReason;
      if (params.status === "PUBLICADA") {
        rev.reportsCount = 0;
      }
      store.reviews.set(rev.id, rev);

      const productReviews = Array.from(store.reviews.values()).filter(
        (r) => r.productId === rev.productId
      );
      const aggregates = computeProductReviewAggregates(productReviews);
      const prod = store.products.get(rev.productId);
      if (prod) {
        prod.ratingAverage = aggregates.ratingAverage;
        prod.reviewsCount = aggregates.reviewsCount;
      }

      return {
        ok: true,
        reviewId: rev.id,
        productId: rev.productId,
        status: rev.status,
        moderationReason: rev.moderationReason,
        reportsCount: rev.reportsCount,
        aggregates,
      };
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
  console.log("=== TDD Suite: Moderación Administrativa de Reseñas (RBAC) ===");

  // Slice 1: verifyReviewsModerationAccess (RBAC ecommerce.resenas)
  {
    const { repo } = createInMemoryAdminReviewRepository({
      staff: new Map<string, AdminStaffActorRecord>([
        [
          "u-admin",
          {
            id: "u-admin",
            name: "Administrador Matacos",
            active: true,
            role: "ADMIN",
            profileLevel: 100,
            effectivePermissions: [REVIEWS_MODERATION_PERMISSION],
          },
        ],
        [
          "u-encargado",
          {
            id: "u-encargado",
            name: "Encargado Local",
            active: true,
            role: "CAJERO",
            profileLevel: 50,
            effectivePermissions: ["ecommerce.pedidos", REVIEWS_MODERATION_PERMISSION],
          },
        ],
        [
          "u-cajero",
          {
            id: "u-cajero",
            name: "Cajero Mostrador",
            active: true,
            role: "CAJERO",
            profileLevel: 10,
            effectivePermissions: ["pos.vender", "inventario.ver"],
          },
        ],
        [
          "u-inactive",
          {
            id: "u-inactive",
            name: "Ex Admin",
            active: false,
            role: "ADMIN",
            profileLevel: 100,
            effectivePermissions: [REVIEWS_MODERATION_PERMISSION],
          },
        ],
      ]),
    });

    const anonCheck = await verifyReviewsModerationAccess(null, repo);
    assert(
      !anonCheck.authorized && Boolean(anonCheck.error),
      "Slice 1a: rechaza usuario no autenticado (null)",
      JSON.stringify(anonCheck)
    );

    const inactiveCheck = await verifyReviewsModerationAccess("u-inactive", repo);
    assert(
      !inactiveCheck.authorized,
      "Slice 1b: rechaza cuenta inactiva incluso si tenía rol ADMIN",
      JSON.stringify(inactiveCheck)
    );

    const cajeroCheck = await verifyReviewsModerationAccess("u-cajero", repo);
    assert(
      !cajeroCheck.authorized,
      "Slice 1c: rechaza Cajero Mostrador sin permiso ecommerce.resenas",
      JSON.stringify(cajeroCheck)
    );

    const adminCheck = await verifyReviewsModerationAccess("u-admin", repo);
    const encargadoCheck = await verifyReviewsModerationAccess("u-encargado", repo);
    assert(
      adminCheck.authorized === true && encargadoCheck.authorized === true,
      "Slice 1d: autoriza Administrador y Encargado con permiso ecommerce.resenas",
      JSON.stringify({ adminCheck, encargadoCheck })
    );
  }

  // Slice 2: listAdminReviews (RBAC, 4 pestañas, busqueda, filtro vacio y contadores)
  {
    const reviewsMap = new Map<string, StoredAdminReviewRecord>([
      ["rev-pub-unanswered", makeReviewFixture({ id: "rev-pub-unanswered", helpfulVotes: 2 })],
      [
        "rev-pub-answered-reported",
        makeReviewFixture({
          id: "rev-pub-answered-reported",
          customerId: "c-2",
          customerName: "Ana López",
          customerEmail: "ana@test.com",
          rating: 4,
          title: "Muy buenas",
          comment: "Llegaron rápido en Formosa.",
          purchasedSize: "38",
          fitFeedback: "CHICO",
          reportsCount: 1,
          reports: [
            {
              id: "rep-1",
              reason: "SPAM",
              comment: "Reporte prueba",
              reporterName: "Carlos M.",
              createdAt: new Date("2026-11-23T10:00:00Z"),
            },
          ],
          adminResponse: "¡Gracias por elegirnos!",
          adminResponseAt: new Date("2026-11-23T12:00:00Z"),
          adminResponderId: "u-admin",
          adminResponderName: "Administrador Matacos",
          createdAt: new Date("2026-11-21T12:00:00Z"),
        }),
      ],
      [
        "rev-in-review",
        makeReviewFixture({
          id: "rev-in-review",
          productId: "p-2",
          productName: "Pelota Mikasa V200W",
          customerId: "c-3",
          customerName: "Lucas S.",
          customerEmail: "lucas@test.com",
          rating: 2,
          title: "Link sospechoso",
          comment: "Miren en https://spam.com",
          purchasedSize: null,
          fitFeedback: null,
          isVerifiedPurchase: false,
          status: "EN_REVISION",
          moderationReason: "Incluye enlaces externos.",
          reportsCount: 3,
          createdAt: new Date("2026-11-24T12:00:00Z"),
        }),
      ],
      [
        "rev-hidden-already",
        makeReviewFixture({
          id: "rev-hidden-already",
          productId: "p-2",
          productName: "Pelota Mikasa V200W",
          customerId: "c-4",
          customerName: "Spam Bot",
          customerEmail: "bot@test.com",
          rating: 1,
          title: "Oculta",
          comment: "Ya fue moderada por el admin.",
          purchasedSize: null,
          fitFeedback: null,
          isVerifiedPurchase: false,
          status: "OCULTA",
          moderationReason: "Spam confirmado",
          reportsCount: 4,
          createdAt: new Date("2026-11-20T12:00:00Z"),
        }),
      ],
    ]);

    const { repo } = createInMemoryAdminReviewRepository({
      staff: new Map<string, AdminStaffActorRecord>([
        [
          "u-encargado",
          {
            id: "u-encargado",
            name: "Encargado Local",
            active: true,
            role: "CAJERO",
            profileLevel: 50,
            effectivePermissions: [REVIEWS_MODERATION_PERMISSION],
          },
        ],
        [
          "u-cajero",
          {
            id: "u-cajero",
            name: "Cajero Mostrador",
            active: true,
            role: "CAJERO",
            profileLevel: 10,
            effectivePermissions: ["pos.vender"],
          },
        ],
      ]),
      reviews: reviewsMap,
    });

    const deniedList = await listAdminReviews("u-cajero", { tab: "ALL" }, repo);
    assert(
      !deniedList.success && Boolean(deniedList.error),
      "Slice 2a: listAdminReviews rechaza usuario sin permiso ecommerce.resenas",
      JSON.stringify(deniedList)
    );

    const pendingTab = await listAdminReviews(
      "u-encargado",
      { tab: "PENDING_REPORTED", productId: "   " },
      repo
    );
    assert(
      pendingTab.success === true &&
        pendingTab.data?.counters.all === 4 &&
        pendingTab.data.counters.pendingOrReported === 2 &&
        pendingTab.data.counters.unanswered === 1 &&
        pendingTab.data.counters.hidden === 1 &&
        pendingTab.data.items.length === 2 &&
        pendingTab.data.items[0]?.id === "rev-in-review" &&
        pendingTab.data.items.every((i) => i.status !== "OCULTA"),
      "Slice 2b: tab PENDING_REPORTED excluye OCULTA, tolera productId vacio y devuelve contadores globales",
      JSON.stringify(pendingTab)
    );

    const unansweredTab = await listAdminReviews(
      "u-encargado",
      { tab: "UNANSWERED" },
      repo
    );
    assert(
      unansweredTab.success === true &&
        unansweredTab.data?.items.length === 1 &&
        unansweredTab.data.items[0]?.id === "rev-pub-unanswered" &&
        unansweredTab.data.items[0]?.publicSignature === STORE_PUBLIC_SIGNATURE,
      "Slice 2c: tab UNANSWERED retorna solo PUBLICADA sin respuesta oficial y firma Matacos Deportes",
      JSON.stringify(unansweredTab)
    );

    const hiddenSearch = await listAdminReviews(
      "u-encargado",
      { tab: "HIDDEN", search: "mikasa", page: 1, pageSize: 1 },
      repo
    );
    assert(
      hiddenSearch.success === true &&
        hiddenSearch.data?.items.length === 1 &&
        hiddenSearch.data.items[0]?.id === "rev-hidden-already" &&
        hiddenSearch.data.totalPages === 1,
      "Slice 2d: tab HIDDEN + busqueda por producto y paginacion funcionan correctamente",
      JSON.stringify(hiddenSearch)
    );
  }

  // Slice 3: respondToCustomerReview (RBAC, Zod, auditoria interna y firma institucional)
  {
    const { repo, store } = createInMemoryAdminReviewRepository({
      staff: new Map<string, AdminStaffActorRecord>([
        [
          "u-admin",
          {
            id: "u-admin",
            name: "Agustín Dellagnolo",
            active: true,
            role: "ADMIN",
            profileLevel: 100,
            effectivePermissions: [REVIEWS_MODERATION_PERMISSION],
          },
        ],
        [
          "u-cajero",
          {
            id: "u-cajero",
            name: "Cajero 1",
            active: true,
            role: "CAJERO",
            profileLevel: 10,
            effectivePermissions: ["pos.vender"],
          },
        ],
      ]),
      reviews: new Map<string, StoredAdminReviewRecord>([
        [
          "rev-10",
          makeReviewFixture({
            id: "rev-10",
            productId: "p-10",
            productName: "Antiparras Arena Cobra",
            customerId: "c-10",
            customerName: "Sofía M.",
            customerEmail: "sofia@test.com",
            title: "No se empañan",
            comment: "Excelente visibilidad entrenando en pileta climatizada.",
            purchasedSize: "Único",
          }),
        ],
      ]),
    });

    const cajeroReply = await respondToCustomerReview(
      "u-cajero",
      { reviewId: "rev-10", response: "¡Muchas gracias por tu opinión!" },
      repo
    );
    assert(
      !cajeroReply.success,
      "Slice 3a: impide responder a usuarios sin permiso ecommerce.resenas",
      JSON.stringify(cajeroReply)
    );

    const shortReply = await respondToCustomerReview(
      "u-admin",
      { reviewId: "rev-10", response: "Ok" },
      repo
    );
    assert(
      !shortReply.success,
      "Slice 3b: rechaza respuesta demasiado corta por Zod",
      JSON.stringify(shortReply)
    );

    const okReply = await respondToCustomerReview(
      "u-admin",
      {
        reviewId: "rev-10",
        response:
          "¡Muchas gracias por tu reseña! Te esperamos en Saavedra 241 cuando necesites renovar equipamiento.",
      },
      repo
    );
    const updatedRow = store.reviews.get("rev-10");
    assert(
      okReply.success === true &&
        okReply.data?.publicSignature === STORE_PUBLIC_SIGNATURE &&
        okReply.data.productId === "p-10" &&
        okReply.data.responderName === "Agustín Dellagnolo" &&
        updatedRow?.adminResponderId === "u-admin" &&
        Boolean(updatedRow?.adminResponseAt),
      "Slice 3c: guarda respuesta oficial con auditoria interna y firma publica Matacos Deportes",
      JSON.stringify({ okReply, updatedRow })
    );
  }

  // Slice 4: moderateCustomerReview (ocultar, preservar motivo en EN_REVISION y restaurar)
  {
    const { repo, store } = createInMemoryAdminReviewRepository({
      staff: new Map<string, AdminStaffActorRecord>([
        [
          "u-encargado",
          {
            id: "u-encargado",
            name: "Encargado Local",
            active: true,
            role: "CAJERO",
            profileLevel: 50,
            effectivePermissions: [REVIEWS_MODERATION_PERMISSION],
          },
        ],
      ]),
      products: new Map([
        [
          "p-mod",
          {
            id: "p-mod",
            name: "Crocs Classic",
            imageUrl: null,
            ratingAverage: 4,
            reviewsCount: 2,
          },
        ],
      ]),
      reviews: new Map<string, StoredAdminReviewRecord>([
        ["rev-a", makeReviewFixture({ id: "rev-a", productId: "p-mod", productName: "Crocs Classic", rating: 5 })],
        [
          "rev-b",
          makeReviewFixture({
            id: "rev-b",
            productId: "p-mod",
            productName: "Crocs Classic",
            customerId: "c-b",
            rating: 3,
            isVerifiedPurchase: false,
            reportsCount: 2,
          }),
        ],
        [
          "rev-c-flagged",
          makeReviewFixture({
            id: "rev-c-flagged",
            productId: "p-mod",
            productName: "Crocs Classic",
            customerId: "c-c",
            rating: 5,
            status: "EN_REVISION",
            moderationReason: "Retenida por 3 reportes.",
            reportsCount: 3,
            reports: [
              {
                id: "rep-hist-1",
                reason: "SPAM",
                comment: "Error",
                reporterName: "Otro",
                createdAt: new Date("2026-11-22T10:00:00Z"),
              },
            ],
          }),
        ],
      ]),
    });

    const hideNoReason = await moderateCustomerReview(
      "u-encargado",
      { reviewId: "rev-b", status: "OCULTA" },
      repo
    );
    assert(
      !hideNoReason.success && Boolean(hideNoReason.error),
      "Slice 4a: ocultar una reseña (OCULTA) exige motivo obligatorio por Zod",
      JSON.stringify(hideNoReason)
    );

    const hideOk = await moderateCustomerReview(
      "u-encargado",
      { reviewId: "rev-b", status: "OCULTA", reason: "Contenido inapropiado confirmado" },
      repo
    );
    assert(
      hideOk.success === true &&
        hideOk.data?.status === "OCULTA" &&
        hideOk.data.moderationReason === "Contenido inapropiado confirmado" &&
        hideOk.data.aggregates.reviewsCount === 1 &&
        hideOk.data.aggregates.ratingAverage === 5 &&
        store.products.get("p-mod")?.ratingAverage === 5,
      "Slice 4b: ocultar reseña publicada actualiza estado, guarda motivo y recalcula promedio del producto",
      JSON.stringify(hideOk)
    );

    const moveToReviewKeepReason = await moderateCustomerReview(
      "u-encargado",
      { reviewId: "rev-b", status: "EN_REVISION" },
      repo
    );
    assert(
      moveToReviewKeepReason.success === true &&
        moveToReviewKeepReason.data?.status === "EN_REVISION" &&
        moveToReviewKeepReason.data.moderationReason === "Contenido inapropiado confirmado",
      "Slice 4c: pasar a EN_REVISION sin nuevo motivo preserva el moderationReason previo",
      JSON.stringify(moveToReviewKeepReason)
    );

    const restoreOk = await moderateCustomerReview(
      "u-encargado",
      { reviewId: "rev-c-flagged", status: "PUBLICADA" },
      repo
    );
    const restoredRow = store.reviews.get("rev-c-flagged");
    assert(
      restoreOk.success === true &&
        restoreOk.data?.status === "PUBLICADA" &&
        restoreOk.data.moderationReason === null &&
        restoreOk.data.reportsCount === 0 &&
        restoredRow?.reports.length === 1 &&
        restoreOk.data.aggregates.reviewsCount === 2 &&
        restoreOk.data.aggregates.ratingAverage === 5,
      "Slice 4d: restaurar a PUBLICADA limpia motivo, resetea reportsCount a 0 preservando auditoria y recalcula agregados",
      JSON.stringify({ restoreOk, reportsLen: restoredRow?.reports.length })
    );
  }

  console.log(`\nResumen: ${passed} pasaron, ${failed} fallaron.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Error fatal en suite TDD admin:", err);
  process.exit(1);
});
