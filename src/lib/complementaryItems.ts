export interface ComplementaryVariant {
  id: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
}

export interface ComplementaryItem {
  id: string;
  name: string;
  brand: string;
  discountTag: string;
  price: number;
  originalPrice: number;
  image: string;
  variants: ComplementaryVariant[];
}

export const COMPLEMENTARY_ITEMS: ComplementaryItem[] = [
  {
    id: "5c6af561-dcaa-422d-b7b4-7120dda5b58e",
    name: "Cinturón de Levantamiento Cuero Pro",
    brand: "Matacos",
    discountTag: "17% OFF",
    price: 49000,
    originalPrice: 59000,
    image: "/placeholder-product.svg",
    variants: [
      { id: "ff513db3-be47-4318-b3c7-d30c5fbd0e9f", color: "Marrón", size: "M", sku: "FIT-MAT-CIN-M", stock: 5 },
      { id: "39400fc5-1157-4d46-bc6d-b6a0acc080c9", color: "Marrón", size: "L", sku: "FIT-MAT-CIN-L", stock: 6 },
    ],
  },
  {
    id: "43917a15-9ea9-4996-aecc-6354cdbb00d3",
    name: "Guantes Deportivos",
    brand: "Matacos",
    discountTag: "20% OFF",
    price: 14983,
    originalPrice: 18500,
    image: "/placeholder-product.svg",
    variants: [
      { id: "414ebf3a-8a85-41e7-9b73-6407a3cfd1e8", color: "Negro", size: "Único", sku: "MAT-GUA-Único-1", stock: 1 },
      { id: "36566ae9-d8c7-44f8-92e0-220fc616f9ee", color: "Naranja", size: "M", sku: "MAT-GUA-M-2", stock: 3 },
    ],
  },
  {
    id: "dcedb8c3-d4c9-4fbe-9394-a2b50ee16cc2",
    name: "Antiparras Mariner Pro",
    brand: "Speedo",
    discountTag: "20% OFF",
    price: 24900,
    originalPrice: 31000,
    image: "/placeholder-product.svg",
    variants: [
      { id: "cdc94db5-6541-4b0d-a9f3-ab64b563a605", color: "Azul", size: "Único", sku: "SPE-NAT-ANT-ÚNIC-AZU", stock: 2 },
      { id: "8f0ee494-7dfb-4549-9694-0c9d5ba6b821", color: "Negro", size: "Único", sku: "SPE-NAT-ANT-ÚNIC-NEG", stock: 1 },
    ],
  },
  {
    id: "4a01f459-6d3b-4f0c-88ea-c8f52b958966",
    name: "Pelotas Paddle x3",
    brand: "Wilson",
    discountTag: "20% OFF",
    price: 14000,
    originalPrice: 17500,
    image: "/placeholder-product.svg",
    variants: [
      { id: "8bc79043-010b-486a-bcc5-8ee01d46d467", color: "Verde", size: "Único", sku: "MAT-PEL-UNICO-H77Z", stock: 10 },
      { id: "e2e98e17-31c7-4838-98fd-72e23d49b70a", color: "Rosa", size: "Único", sku: "MAT-PEL-UNICO-H77Z-2", stock: 7 },
      { id: "fc8999a4-5543-4d4a-a503-2ff7cba20919", color: "Beige", size: "Único", sku: "MAT-PEL-UNICO-D9OS-3", stock: 3 },
    ],
  },
];
