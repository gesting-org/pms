import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper: offset from today
function d(offsetDays: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(12, 0, 0, 0);
  return dt;
}

function ymd(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day, 12, 0, 0, 0);
}

async function main() {
  console.log("🌱 Iniciando seed completo...");

  // ─── Admin user ───────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("gesting2025", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gesting.com.ar" },
    update: {},
    create: {
      id: "admin-1",
      email: "admin@gesting.com.ar",
      name: "Administrador Gesting",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Usuario admin:", admin.email);

  // ─── Configuración Gesting ────────────────────────────────────────────────
  await prisma.gestingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Gesting PMS",
      representative: "Administrador Gesting",
      representativeDni: "30.000.000",
      cuit: "30-00000000-0",
      address: "Buenos Aires, CABA",
      defaultCommission: 20,
    },
  });
  console.log("✅ Configuración Gesting");

  // ─── Propietarios ─────────────────────────────────────────────────────────
  const own1 = await prisma.owner.upsert({
    where: { email: "carlos.bergman@gmail.com" },
    update: {},
    create: {
      id: "own-1",
      firstName: "Carlos",
      lastName: "Bergman",
      dni: "20456789",
      cuit: "20-20456789-4",
      email: "carlos.bergman@gmail.com",
      phone: "+54 9 11 4567-8900",
      address: "Av. Santa Fe 2100, Piso 3",
      city: "Buenos Aires",
      province: "CABA",
      bankName: "Banco Galicia",
      bankAlias: "BERGMAN.CARLOS.BG",
      isActive: true,
    },
  });

  const own2 = await prisma.owner.upsert({
    where: { email: "maria.soto@outlook.com" },
    update: {},
    create: {
      id: "own-2",
      firstName: "María Elena",
      lastName: "Soto",
      dni: "27812345",
      cuit: "27-27812345-1",
      email: "maria.soto@outlook.com",
      phone: "+54 9 11 6789-0123",
      address: "Cabello 3456, Piso 2, Dto A",
      city: "Buenos Aires",
      province: "CABA",
      bankName: "Banco Nación",
      bankAlias: "SOTO.MARIA.BNA",
      isActive: true,
    },
  });

  const own3 = await prisma.owner.upsert({
    where: { email: "rfeld@inversiones.com" },
    update: {},
    create: {
      id: "own-3",
      firstName: "Roberto",
      lastName: "Feld",
      dni: "14223001",
      cuit: "20-14223001-8",
      email: "rfeld@inversiones.com",
      phone: "+54 9 11 5551-2020",
      city: "Buenos Aires",
      province: "CABA",
      bankName: "BBVA",
      bankAlias: "FELD.ROBERTO.BBVA",
      isActive: true,
    },
  });
  console.log("✅ Propietarios: own-1, own-2, own-3");

  // ─── Propiedades ──────────────────────────────────────────────────────────
  const prop1 = await prisma.property.upsert({
    where: { id: "prop-1" },
    update: {},
    create: {
      id: "prop-1",
      ownerId: own1.id,
      name: "Palermo Hollywood 3A",
      address: "Jorge Newbery 3456, Piso 3, Dto A",
      city: "Buenos Aires",
      province: "CABA",
      description: "Hermoso departamento en el corazón de Palermo Hollywood. Luminoso, totalmente equipado, con balcón y vista a la ciudad.",
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      amenities: ["WiFi", "Aire acondicionado", "Smart TV", "Cocina equipada", "Lavarropas", "Balcón"],
      status: "ACTIVE",
      colorTag: "#3B82F6",
      commissionRate: 20,
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: "prop-2" },
    update: {},
    create: {
      id: "prop-2",
      ownerId: own1.id,
      name: "Belgrano R Monoambiente",
      address: "Juramento 2890, Piso 7, Dto B",
      city: "Buenos Aires",
      province: "CABA",
      description: "Monoambiente moderno con amenities premium en Belgrano R.",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      amenities: ["WiFi", "Gimnasio", "Cochera", "Seguridad 24h", "Aire acondicionado"],
      status: "ACTIVE",
      colorTag: "#8B5CF6",
      commissionRate: 20,
    },
  });

  const prop3 = await prisma.property.upsert({
    where: { id: "prop-3" },
    update: {},
    create: {
      id: "prop-3",
      ownerId: own2.id,
      name: "Recoleta 2 Ambientes",
      address: "Juncal 1850, Piso 5, Dto D",
      city: "Buenos Aires",
      province: "CABA",
      description: "Elegante 2 ambientes en Recoleta, piso de madera, totalmente renovado.",
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 3,
      amenities: ["WiFi", "Smart TV", "Cocina equipada", "Portero 24h", "Calefacción central"],
      status: "ACTIVE",
      colorTag: "#10B981",
      commissionRate: 18,
    },
  });

  const prop4 = await prisma.property.upsert({
    where: { id: "prop-4" },
    update: {},
    create: {
      id: "prop-4",
      ownerId: own2.id,
      name: "Villa Urquiza PH Dúplex",
      address: "Triunvirato 4780",
      city: "Buenos Aires",
      province: "CABA",
      description: "PH dúplex con terraza privada y parrilla. Ideal para grupos.",
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      amenities: ["WiFi", "Terraza", "Parrilla", "Cochera", "Lavarropas", "Estudio"],
      status: "MAINTENANCE",
      colorTag: "#F59E0B",
      commissionRate: 20,
    },
  });

  const prop5 = await prisma.property.upsert({
    where: { id: "prop-5" },
    update: {},
    create: {
      id: "prop-5",
      ownerId: own3.id,
      name: "San Telmo Loft",
      address: "Defensa 890, Piso 1, Loft B",
      city: "Buenos Aires",
      province: "CABA",
      description: "Loft de diseño en San Telmo. Doble altura, muy luminoso y moderno.",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      amenities: ["WiFi", "Smart TV", "Diseño arquitectónico", "Doble altura", "Bicicleta incluida"],
      status: "ACTIVE",
      colorTag: "#EF4444",
      commissionRate: 22,
    },
  });

  const prop6 = await prisma.property.upsert({
    where: { id: "prop-6" },
    update: {},
    create: {
      id: "prop-6",
      ownerId: own3.id,
      name: "Palermo Soho Studio",
      address: "Thames 1650, Piso 2",
      city: "Buenos Aires",
      province: "CABA",
      description: "Studio moderno en Palermo Soho, a pasos de los mejores restaurantes.",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      amenities: ["WiFi", "Aire acondicionado", "Smart TV", "Cocina equipada"],
      status: "ACTIVE",
      colorTag: "#6366F1",
      commissionRate: 20,
    },
  });
  console.log("✅ Propiedades: prop-1 a prop-6");

  // ─── Platforms ────────────────────────────────────────────────────────────
  // Delete existing and recreate (cleanest approach for seed)
  await prisma.propertyPlatform.deleteMany({
    where: { propertyId: { in: ["prop-1","prop-2","prop-3","prop-4","prop-5","prop-6"] } },
  });

  await prisma.propertyPlatform.createMany({
    data: [
      { propertyId: "prop-1", platform: "AIRBNB", listingUrl: "https://airbnb.com/rooms/12345", listingId: "12345", isActive: true },
      { propertyId: "prop-1", platform: "BOOKING", isActive: true },
      { propertyId: "prop-2", platform: "AIRBNB", listingUrl: "https://airbnb.com/rooms/67890", listingId: "67890", isActive: true },
      { propertyId: "prop-2", platform: "DIRECT", isActive: true },
      { propertyId: "prop-3", platform: "AIRBNB", listingUrl: "https://airbnb.com/rooms/11111", listingId: "11111", isActive: true },
      { propertyId: "prop-3", platform: "BOOKING", isActive: true },
      { propertyId: "prop-3", platform: "DIRECT", isActive: true },
      { propertyId: "prop-4", platform: "AIRBNB", isActive: true },
      { propertyId: "prop-5", platform: "AIRBNB", listingUrl: "https://airbnb.com/rooms/22222", listingId: "22222", isActive: true },
      { propertyId: "prop-5", platform: "BOOKING", isActive: true },
      { propertyId: "prop-6", platform: "AIRBNB", isActive: true },
      { propertyId: "prop-6", platform: "DIRECT", isActive: true },
    ],
  });
  console.log("✅ Platforms");

  // ─── Huéspedes ────────────────────────────────────────────────────────────
  await prisma.guest.upsert({
    where: { id: "guest-1" },
    update: {},
    create: {
      id: "guest-1",
      firstName: "Valentina",
      lastName: "Morales",
      email: "vmorales@gmail.com",
      phone: "+54 9 11 3344-5566",
      nationality: "Argentina",
    },
  });

  await prisma.guest.upsert({
    where: { id: "guest-2" },
    update: {},
    create: {
      id: "guest-2",
      firstName: "James",
      lastName: "Mitchell",
      email: "jmitchell@outlook.com",
      phone: "+1 555 234 5678",
      nationality: "Estados Unidos",
    },
  });

  await prisma.guest.upsert({
    where: { id: "guest-3" },
    update: {},
    create: {
      id: "guest-3",
      firstName: "Florencia",
      lastName: "Reyes",
      email: "flor.reyes@icloud.com",
      phone: "+54 9 11 9900-1122",
      nationality: "Argentina",
    },
  });

  await prisma.guest.upsert({
    where: { id: "guest-4" },
    update: {},
    create: {
      id: "guest-4",
      firstName: "Lucas",
      lastName: "Fernández",
      email: "lucas.f@gmail.com",
      phone: "+54 9 11 7788-3344",
      nationality: "Argentina",
    },
  });

  await prisma.guest.upsert({
    where: { id: "guest-5" },
    update: {},
    create: {
      id: "guest-5",
      firstName: "Sophie",
      lastName: "Dupont",
      email: "sdupont@mail.fr",
      phone: "+33 6 12 34 56 78",
      nationality: "Francia",
    },
  });

  await prisma.guest.upsert({
    where: { id: "guest-6" },
    update: {},
    create: {
      id: "guest-6",
      firstName: "Martín",
      lastName: "López",
      email: "martin.lopez@gmail.com",
      phone: "+54 9 11 5566-7788",
      nationality: "Argentina",
    },
  });
  console.log("✅ Huéspedes: guest-1 a guest-6");

  // ─── Reservas ─────────────────────────────────────────────────────────────
  await prisma.reservation.upsert({
    where: { id: "res-1" },
    update: {},
    create: {
      id: "res-1",
      propertyId: "prop-1",
      guestId: "guest-1",
      platform: "AIRBNB",
      externalId: "AIR-884421",
      checkIn: d(-2),
      checkOut: d(5),
      nights: 7,
      grossAmount: 315000,
      platformFee: 47250,
      netAmount: 267750,
      status: "IN_PROGRESS",
      paymentStatus: "PAID",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "res-2" },
    update: {},
    create: {
      id: "res-2",
      propertyId: "prop-1",
      guestId: "guest-2",
      platform: "BOOKING",
      checkIn: d(8),
      checkOut: d(13),
      nights: 5,
      grossAmount: 225000,
      platformFee: 33750,
      netAmount: 191250,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "res-3" },
    update: {},
    create: {
      id: "res-3",
      propertyId: "prop-3",
      guestId: "guest-3",
      platform: "AIRBNB",
      externalId: "AIR-772100",
      checkIn: d(-35),
      checkOut: d(-28),
      nights: 7,
      grossAmount: 385000,
      platformFee: 57750,
      netAmount: 327250,
      status: "COMPLETED",
      paymentStatus: "PAID",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "res-4" },
    update: {},
    create: {
      id: "res-4",
      propertyId: "prop-3",
      guestId: "guest-5",
      platform: "DIRECT",
      checkIn: d(-1),
      checkOut: d(4),
      nights: 5,
      grossAmount: 275000,
      platformFee: 0,
      netAmount: 275000,
      status: "IN_PROGRESS",
      paymentStatus: "PAID",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "res-5" },
    update: {},
    create: {
      id: "res-5",
      propertyId: "prop-5",
      guestId: "guest-4",
      platform: "AIRBNB",
      externalId: "AIR-991234",
      checkIn: d(3),
      checkOut: d(8),
      nights: 5,
      grossAmount: 200000,
      platformFee: 30000,
      netAmount: 170000,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "res-6" },
    update: {},
    create: {
      id: "res-6",
      propertyId: "prop-2",
      guestId: "guest-6",
      platform: "DIRECT",
      checkIn: d(-20),
      checkOut: d(-16),
      nights: 4,
      grossAmount: 128000,
      platformFee: 0,
      netAmount: 128000,
      status: "COMPLETED",
      paymentStatus: "PAID",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "res-7" },
    update: {},
    create: {
      id: "res-7",
      propertyId: "prop-6",
      guestId: "guest-2",
      platform: "AIRBNB",
      checkIn: d(10),
      checkOut: d(15),
      nights: 5,
      grossAmount: 190000,
      platformFee: 28500,
      netAmount: 161500,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
    },
  });
  console.log("✅ Reservas: res-1 a res-7");

  // ─── Gastos ───────────────────────────────────────────────────────────────
  await prisma.expense.upsert({
    where: { id: "exp-1" },
    update: {},
    create: {
      id: "exp-1",
      propertyId: "prop-4",
      category: "REPAIR",
      description: "Reparación cañería cocina — plomero García",
      amount: 45000,
      date: d(-8),
      status: "ADVANCED_BY_GESTING",
    },
  });

  await prisma.expense.upsert({
    where: { id: "exp-2" },
    update: {},
    create: {
      id: "exp-2",
      propertyId: "prop-1",
      category: "CLEANING",
      description: "Limpieza profunda post reserva larga",
      amount: 12000,
      date: d(-28),
      status: "REIMBURSED",
    },
  });

  await prisma.expense.upsert({
    where: { id: "exp-3" },
    update: {},
    create: {
      id: "exp-3",
      propertyId: "prop-3",
      category: "MAINTENANCE",
      description: "Service aire acondicionado",
      amount: 18000,
      date: d(-15),
      status: "ADVANCED_BY_GESTING",
    },
  });

  await prisma.expense.upsert({
    where: { id: "exp-4" },
    update: {},
    create: {
      id: "exp-4",
      propertyId: "prop-5",
      category: "SUPPLIES",
      description: "Reposición amenities — shampoo, toallas, jabones",
      amount: 8500,
      date: d(-5),
      status: "REIMBURSED",
    },
  });

  await prisma.expense.upsert({
    where: { id: "exp-5" },
    update: {},
    create: {
      id: "exp-5",
      propertyId: "prop-2",
      category: "UTILITY",
      description: "Deuda Edesur pendiente",
      amount: 6200,
      date: d(-12),
      status: "ADVANCED_BY_GESTING",
    },
  });
  console.log("✅ Gastos: exp-1 a exp-5");

  // ─── Tareas ───────────────────────────────────────────────────────────────
  await prisma.task.upsert({
    where: { id: "tsk-1" },
    update: {},
    create: {
      id: "tsk-1",
      propertyId: "prop-1",
      reservationId: "res-1",
      type: "CLEANING",
      title: "Limpieza check-out Valentina Morales",
      priority: "HIGH",
      scheduledDate: d(5),
      estimatedCost: 8000,
      provider: "Servicio de limpieza Gesting",
      status: "PENDING",
    },
  });

  await prisma.task.upsert({
    where: { id: "tsk-2" },
    update: {},
    create: {
      id: "tsk-2",
      propertyId: "prop-4",
      type: "REPAIR",
      title: "Refacción baño principal",
      description: "Cambio de cerámicos y ducha",
      priority: "URGENT",
      scheduledDate: d(2),
      estimatedCost: 120000,
      provider: "Gasista Ramírez",
      status: "IN_PROGRESS",
    },
  });

  await prisma.task.upsert({
    where: { id: "tsk-3" },
    update: {},
    create: {
      id: "tsk-3",
      propertyId: "prop-3",
      reservationId: "res-4",
      type: "CLEANING",
      title: "Limpieza pre check-in Sophie Dupont",
      priority: "HIGH",
      scheduledDate: d(-1),
      estimatedCost: 7500,
      actualCost: 7500,
      status: "COMPLETED",
      completedAt: d(-1),
    },
  });

  await prisma.task.upsert({
    where: { id: "tsk-4" },
    update: {},
    create: {
      id: "tsk-4",
      propertyId: "prop-2",
      type: "INSPECTION",
      title: "Inspección anual de gas",
      description: "Habilitación anual obligatoria Metrogas",
      priority: "HIGH",
      scheduledDate: d(7),
      estimatedCost: 12000,
      status: "PENDING",
    },
  });

  await prisma.task.upsert({
    where: { id: "tsk-5" },
    update: {},
    create: {
      id: "tsk-5",
      propertyId: "prop-5",
      reservationId: "res-5",
      type: "CLEANING",
      title: "Limpieza pre check-in Lucas Fernández",
      priority: "MEDIUM",
      scheduledDate: d(3),
      estimatedCost: 6000,
      status: "PENDING",
    },
  });

  await prisma.task.upsert({
    where: { id: "tsk-6" },
    update: {},
    create: {
      id: "tsk-6",
      propertyId: "prop-1",
      type: "RESTOCKING",
      title: "Reponer amenities depto 3A",
      priority: "LOW",
      scheduledDate: d(6),
      estimatedCost: 3500,
      status: "PENDING",
    },
  });
  console.log("✅ Tareas: tsk-1 a tsk-6");

  // ─── Liquidaciones ────────────────────────────────────────────────────────
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevY = prevMonth.getFullYear();
  const prevM = prevMonth.getMonth() + 1;
  const prevLabel = prevMonth.toLocaleString("es-AR", { month: "long", year: "numeric" });
  const capitalizedLabel = prevLabel.charAt(0).toUpperCase() + prevLabel.slice(1);

  // Upsert with conflict on (propertyId, periodYear, periodMonth)
  const liq1 = await prisma.liquidation.upsert({
    where: { propertyId_periodYear_periodMonth: { propertyId: "prop-3", periodYear: prevY, periodMonth: prevM } },
    update: {},
    create: {
      id: "liq-1",
      propertyId: "prop-3",
      periodLabel: capitalizedLabel,
      periodYear: prevY,
      periodMonth: prevM,
      grossIncome: 385000,
      platformFees: 57750,
      operationalExpenses: 18000,
      commissionRate: 18,
      commissionAmount: 58905,
      netToOwner: 276845,
      totalDue: 276845,
      dueDate: d(5),
      status: "SENT",
    },
  });

  const liq2 = await prisma.liquidation.upsert({
    where: { propertyId_periodYear_periodMonth: { propertyId: "prop-2", periodYear: prevY, periodMonth: prevM } },
    update: {},
    create: {
      id: "liq-2",
      propertyId: "prop-2",
      periodLabel: capitalizedLabel,
      periodYear: prevY,
      periodMonth: prevM,
      grossIncome: 128000,
      platformFees: 0,
      operationalExpenses: 6200,
      commissionRate: 20,
      commissionAmount: 25600,
      netToOwner: 107400,
      totalDue: 107400,
      dueDate: d(-2),
      paidAt: d(-1),
      status: "PAID",
    },
  });

  // Link reservations to liquidations
  await prisma.reservation.update({ where: { id: "res-3" }, data: { liquidationId: liq1.id } });
  await prisma.reservation.update({ where: { id: "res-6" }, data: { liquidationId: liq2.id } });
  console.log("✅ Liquidaciones: liq-1, liq-2");

  // ─── Contratos de gestión ─────────────────────────────────────────────────
  await prisma.managementContract.upsert({
    where: { contractNumber: "GEST-2024-0041" },
    update: {},
    create: {
      id: "con-1",
      propertyId: "prop-1",
      ownerId: own1.id,
      contractNumber: "GEST-2024-0041",
      startDate: ymd(2024, 1, 1),
      endDate: ymd(2025, 12, 31),
      durationMonths: 24,
      commissionRate: 20,
      city: "Buenos Aires",
      ownerFullName: "Carlos Bergman",
      ownerDni: "20.456.789",
      ownerCuit: "20-20456789-4",
      ownerAddress: "Av. Santa Fe 2100, Piso 3, CABA",
      gestingRepName: "Administrador Gesting",
      gestingRepDni: "30.000.000",
      gestingCuit: "30-00000000-0",
      gestingAddress: "Buenos Aires, CABA",
      propertyAddress: "Jorge Newbery 3456, Piso 3, Dto A, CABA",
      status: "ACTIVE",
      signedAt: ymd(2023, 12, 20),
    },
  });

  await prisma.managementContract.upsert({
    where: { contractNumber: "GEST-2024-0042" },
    update: {},
    create: {
      id: "con-2",
      propertyId: "prop-2",
      ownerId: own1.id,
      contractNumber: "GEST-2024-0042",
      startDate: ymd(2024, 1, 1),
      endDate: ymd(2025, 12, 31),
      durationMonths: 24,
      commissionRate: 20,
      city: "Buenos Aires",
      ownerFullName: "Carlos Bergman",
      ownerDni: "20.456.789",
      ownerCuit: "20-20456789-4",
      ownerAddress: "Av. Santa Fe 2100, Piso 3, CABA",
      gestingRepName: "Administrador Gesting",
      gestingRepDni: "30.000.000",
      gestingCuit: "30-00000000-0",
      gestingAddress: "Buenos Aires, CABA",
      propertyAddress: "Juramento 2890, Piso 7, Dto B, CABA",
      status: "ACTIVE",
      signedAt: ymd(2023, 12, 20),
    },
  });

  await prisma.managementContract.upsert({
    where: { contractNumber: "GEST-2023-0028" },
    update: {},
    create: {
      id: "con-3",
      propertyId: "prop-3",
      ownerId: own2.id,
      contractNumber: "GEST-2023-0028",
      startDate: ymd(2023, 6, 1),
      endDate: d(25),
      durationMonths: 24,
      commissionRate: 18,
      city: "Buenos Aires",
      ownerFullName: "María Elena Soto",
      ownerDni: "27.812.345",
      ownerCuit: "27-27812345-1",
      ownerAddress: "Cabello 3456, Piso 2, Dto A, CABA",
      gestingRepName: "Administrador Gesting",
      gestingRepDni: "30.000.000",
      gestingCuit: "30-00000000-0",
      gestingAddress: "Buenos Aires, CABA",
      propertyAddress: "Juncal 1850, Piso 5, Dto D, CABA",
      status: "EXPIRING_SOON",
      signedAt: ymd(2023, 5, 25),
    },
  });
  console.log("✅ Contratos: con-1, con-2, con-3");

  // ─── Mensajes ─────────────────────────────────────────────────────────────
  await prisma.message.upsert({
    where: { id: "msg-1" },
    update: {},
    create: {
      id: "msg-1",
      guestId: "guest-1",
      reservationId: "res-1",
      propertyId: "prop-1",
      direction: "INBOUND",
      channel: "WHATSAPP",
      subject: "Consulta sobre check-in",
      body: "Hola! ¿A qué hora puedo hacer el check-in? Llego en vuelo a las 14hs.",
      status: "READ",
      sentAt: d(-1),
    },
  });

  await prisma.message.upsert({
    where: { id: "msg-2" },
    update: {},
    create: {
      id: "msg-2",
      guestId: "guest-2",
      reservationId: "res-2",
      propertyId: "prop-1",
      direction: "INBOUND",
      channel: "EMAIL",
      subject: "Confirmar reserva",
      body: "Hi! I'd like to confirm my reservation. Can you send me the check-in instructions?",
      status: "DELIVERED",
      sentAt: d(-2),
    },
  });

  await prisma.message.upsert({
    where: { id: "msg-3" },
    update: {},
    create: {
      id: "msg-3",
      guestId: "guest-3",
      reservationId: "res-3",
      propertyId: "prop-3",
      direction: "OUTBOUND",
      channel: "WHATSAPP",
      subject: "Re: Problema con calefacción",
      body: "Hola Florencia, ya mandamos al técnico. Pasa mañana a las 10hs.",
      status: "READ",
      sentAt: d(-30),
    },
  });

  await prisma.message.upsert({
    where: { id: "msg-4" },
    update: {},
    create: {
      id: "msg-4",
      guestId: "guest-5",
      reservationId: "res-4",
      propertyId: "prop-3",
      direction: "INBOUND",
      channel: "EMAIL",
      subject: "Merci pour l'accueil",
      body: "Bonjour, nous sommes très bien installés. Le logement est magnifique!",
      status: "READ",
      sentAt: d(0),
    },
  });
  console.log("✅ Mensajes: msg-1 a msg-4");

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 Email:      admin@gesting.com.ar");
  console.log("🔑 Contraseña: gesting2025");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
