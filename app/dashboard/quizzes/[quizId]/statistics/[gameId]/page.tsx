import { requireUser } from "@/app/data/user/require-user";
import StatsClient from "./_components/StatsClient";

type Props = {
  params: { gameId: string };
};

export default async function StatisticsPage({ params: { gameId } }: Props) {
  // Keep your auth protection
  await requireUser();

  // All data reading happens client-side from localStorage
  return <StatsClient gameId={gameId} />;
}
