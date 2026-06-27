import { BRANCHES, BRANCH_DEFAULT } from "@/lib/hubs/branches";

export function BranchSelector({ name = "branchId", defaultValue = BRANCH_DEFAULT }: { name?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-1 text-sm font-black text-[#66745c]">
      Rama operativa
      <select name={name} defaultValue={defaultValue} className="rounded-xl border border-[#cfd8c6] bg-white px-3 py-2 font-bold text-[#1f2a1d] outline-none">
        {BRANCHES.map((branch) => <option key={branch.slug} value={branch.slug}>{branch.icon} {branch.name}</option>)}
      </select>
    </label>
  );
}
