import { requireUser } from "@/app/data/user/require-user";
import StatsClient from "./_components/StatsClient";

type Props = {
  params: Promise<{ gameId: string }>; // Promise in Next.js 15
};

export default async function StatisticsPage({ params }: Props) {
  // Keep your auth protection
  await requireUser();

  const { gameId } = await params;

  // All data reading happens client-side from localStorage
  return <StatsClient gameId={gameId} />;
}
