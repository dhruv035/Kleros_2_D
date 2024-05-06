"use server";
import Games from "./components/Games";
import { loadDeployments } from "./actions/front-end/deployments";
export default async function Home() {
  const data = await loadDeployments();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Games deployments={data ?? ([] as string[])} />
    </main>
  );
}
