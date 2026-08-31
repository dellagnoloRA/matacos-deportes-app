import Dexie, { type Table } from "dexie";

export interface LocalProduct {
  id: string;
  name: string;
  brand: string;
  discipline: string;
  variantId: string;
  size: string;
  color: string;
  barcode: string;
  price: number;
  stock: number;
}

export interface LocalSaleItem {
  variantId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  subtotal: number;
  discount: number;
}

export interface LocalSale {
  id?: number;
  clientTempId: string;
  items: LocalSaleItem[];
  total: number;
  discount: number;
  paymentMethod: "EFECTIVO" | "TARJETA" | "QR" | "TRANSFERENCIA" | "MIXTO";
  amountPaid: number;
  changeGiven: number;
  createdAt: Date;
  synced: boolean;
}

export class MatacosOfflineDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  sales!: Table<LocalSale, number>;

  constructor() {
    super("MatacosPOS_DB");
    this.version(1).stores({
      products: "variantId, barcode, name, brand, discipline",
      sales: "++id, clientTempId, synced, createdAt",
    });
  }
}

export const localDb = new MatacosOfflineDatabase();
