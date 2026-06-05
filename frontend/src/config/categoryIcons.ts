import {
  Briefcase,
  CalendarClock,
  Car,
  ChefHat,
  CircleEllipsis,
  CreditCard,
  FileText,
  Gamepad2,
  Gift,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Store,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export const categoryIconOptions: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: 'briefcase', label: 'Trabajo', icon: Briefcase },
  { value: 'laptop', label: 'Freelance', icon: Laptop },
  { value: 'store', label: 'Ventas', icon: Store },
  { value: 'gift', label: 'Bono', icon: Gift },
  { value: 'landmark', label: 'Banco', icon: Landmark },
  { value: 'rotate-ccw', label: 'Reembolso', icon: RotateCcw },
  { value: 'utensils', label: 'Comida', icon: Utensils },
  { value: 'chef-hat', label: 'Restaurante', icon: ChefHat },
  { value: 'car', label: 'Transporte', icon: Car },
  { value: 'home', label: 'Vivienda', icon: Home },
  { value: 'receipt', label: 'Servicios', icon: Receipt },
  { value: 'heart-pulse', label: 'Salud', icon: HeartPulse },
  { value: 'graduation-cap', label: 'Educación', icon: GraduationCap },
  { value: 'shopping-bag', label: 'Compras', icon: ShoppingBag },
  { value: 'gamepad-2', label: 'Ocio', icon: Gamepad2 },
  { value: 'calendar-clock', label: 'Suscripción', icon: CalendarClock },
  { value: 'plane', label: 'Viajes', icon: Plane },
  { value: 'paw-print', label: 'Mascotas', icon: PawPrint },
  { value: 'file-text', label: 'Impuestos', icon: FileText },
  { value: 'piggy-bank', label: 'Ahorro', icon: PiggyBank },
  { value: 'credit-card', label: 'Deudas', icon: CreditCard },
  { value: 'hand-heart', label: 'Donaciones', icon: HandHeart },
  { value: 'wallet', label: 'Dinero', icon: Wallet },
  { value: 'circle-ellipsis', label: 'Otros', icon: CircleEllipsis },
];

export const categoryIconByValue = categoryIconOptions.reduce<Record<string, LucideIcon>>((icons, option) => {
  icons[option.value] = option.icon;
  return icons;
}, {});

export const fallbackCategoryIcon = CircleEllipsis;
