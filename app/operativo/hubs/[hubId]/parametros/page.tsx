import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";
import { HubParametrosOperativosEditor } from "@/components/operativo/HubParametrosOperativosEditor";

export default async function ParametrosOperativosHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-6xl gap-5">
        <HubNav hub={hub} active="parametros" />
        <HubParametrosOperativosEditor hub={hub} />
      </div>
    </main>
  );
}
