"use server";
import Games from "./components/Games";
import { loadDeployments } from "./actions/front-end/deployments";
export default async function Home() {
  const data = await loadDeployments();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="text-4xl h-20">RPSSL</div>
      <Games deployments={data ?? ([] as string[])} />
    </main>
  );
}
