import { HUB_CATEGORIES, HUB_CATEGORY_DEFAULT } from "@/lib/hubs/hubCategories";

export function HubCategorySelector({ name = "categoriaId", defaultValue = HUB_CATEGORY_DEFAULT }: { name?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-1 text-sm font-black text-[#66745c]">
      Categoría del Hub
      <select name={name} defaultValue={defaultValue} className="rounded-xl border border-[#cfd8c6] bg-white px-3 py-2 font-bold text-[#1f2a1d] outline-none">
        {HUB_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.nombre}</option>)}
      </select>
    </label>
  );
}
