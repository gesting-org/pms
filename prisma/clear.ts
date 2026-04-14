/**
 * clear.ts — Borra todos los datos mock de la DB.
 * Mantiene: usuario admin y GestingConfig.
 * Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/clear.ts
 *   o: npx tsx prisma/clear.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Limpiando datos mock...\n");

  // Orden importante: primero tablas con FK hacia otras
  const automationLogs = await prisma.automationLog.deleteMany();
  console.log(`✅ AutomationLog: ${automationLogs.count} eliminados`);

  const automationRules = await prisma.automationRule.deleteMany();
  console.log(`✅ AutomationRule: ${automationRules.count} eliminados`);

  const messages = await prisma.message.deleteMany();
  console.log(`✅ Message: ${messages.count} eliminados`);

  const tasks = await prisma.task.deleteMany();
  console.log(`✅ Task: ${tasks.count} eliminados`);

  const calendarBlocks = await prisma.calendarBlock.deleteMany();
  console.log(`✅ CalendarBlock: ${calendarBlocks.count} eliminados`);

  const expenses = await prisma.expense.deleteMany();
  console.log(`✅ Expense: ${expenses.count} eliminados`);

  const liquidations = await prisma.liquidation.deleteMany();
  console.log(`✅ Liquidation: ${liquidations.count} eliminados`);

  const reservations = await prisma.reservation.deleteMany();
  console.log(`✅ Reservation: ${reservations.count} eliminados`);

  const contracts = await prisma.managementContract.deleteMany();
  console.log(`✅ ManagementContract: ${contracts.count} eliminados`);

  const guests = await prisma.guest.deleteMany();
  console.log(`✅ Guest: ${guests.count} eliminados`);

  const propertyPhotos = await prisma.propertyPhoto.deleteMany();
  console.log(`✅ PropertyPhoto: ${propertyPhotos.count} eliminados`);

  const propertyPlatforms = await prisma.propertyPlatform.deleteMany();
  console.log(`✅ PropertyPlatform: ${propertyPlatforms.count} eliminados`);

  const properties = await prisma.property.deleteMany();
  console.log(`✅ Property: ${properties.count} eliminados`);

  const owners = await prisma.owner.deleteMany();
  console.log(`✅ Owner: ${owners.count} eliminados`);

  const googleTokens = await prisma.googleToken.deleteMany();
  console.log(`✅ GoogleToken: ${googleTokens.count} eliminados`);

  // NextAuth sessions — limpiar sesiones viejas pero NO usuarios
  const sessions = await prisma.session.deleteMany();
  console.log(`✅ Session: ${sessions.count} eliminados`);

  const verificationTokens = await prisma.verificationToken.deleteMany();
  console.log(`✅ VerificationToken: ${verificationTokens.count} eliminados`);

  const accounts = await prisma.account.deleteMany();
  console.log(`✅ Account: ${accounts.count} eliminados`);

  console.log("\n✨ DB limpia. Usuario admin y GestingConfig intactos.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
