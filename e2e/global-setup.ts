// Prepara o banco antes da suíte e2e: garante o admin fixo.
import { garantirAdmin } from "./helpers/db";

async function globalSetup() {
  await garantirAdmin();
}

export default globalSetup;
