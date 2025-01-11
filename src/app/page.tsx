"use server";

import Games from "./components/Games";
import { loadDeployments } from "./actions/front-end/deployments";

export default async function Home() {
  const data = await loadDeployments();
  
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Rock Paper Scissors</h1>
        <p className="text-lg text-gray-600">Play the classic game on the blockchain!</p>
      </div>
      <Games initialDeployments={data ?? []} />
    </main>
  );
}
