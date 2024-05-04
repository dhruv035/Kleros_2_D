'use server'
import Games from "./components/Games";
import { loadDeployements } from "./services/front-end/deployements";
export default async function Home() {
  const data = await loadDeployements();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Games deployements={data} />
      
    </main>
  );
}
