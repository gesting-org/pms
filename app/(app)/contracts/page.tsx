export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { getContracts } from "@/lib/db/queries";
import { serializeContract } from "@/lib/db/serialize";
import { ContractsList } from "./components/contracts-list";

export const metadata = { title: "Contratos" };

export default async function ContractsPage() {
  const rawContracts = await getContracts();
  const contracts = rawContracts.map((c) => serializeContract(c as any));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Contratos" subtitle={`${contracts.length} contratos`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <ContractsList contracts={contracts as any} />
      </div>
    </div>
  );
}
