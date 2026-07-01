require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/userModel");
const Station = require("./models/stationModel");
const Session = require("./models/sessionModel");

const seedTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Clear old test sessions/stations (keep users)
    await Session.deleteMany({});
    await Station.deleteMany({});
    console.log("Cleared old sessions and stations.");

    // Ensure test users exist
    const admin = await User.findOne({ username: "admin1" });
    if (!admin) {
      await User.create({ username: "admin1", password: "123", role: "admin", balance: 0 });
      console.log("Created admin1 / 123");
    }

    let customer = await User.findOne({ username: "user1" });
    if (!customer) {
      customer = await User.create({ username: "user1", password: "123", role: "customer", balance: 500 });
      console.log("Created user1 / 123 with balance 500");
    } else {
      customer.balance = 500;
      await customer.save();
      console.log("Reset user1 balance to 500");
    }

    // Create stations
    const station1 = await Station.create({
      stationCode: "ST-FAST-001",
      type: "FastCharge",
      status: "available",
      pricePerKwh: 0.35,
      connectors: ["CCS2", "CHAdeMO"],
      isOccupied: false
    });
    console.log("Created station ST-FAST-001");

    const station2 = await Station.create({
      stationCode: "ST-NORM-001",
      type: "NormalCharge",
      status: "available",
      pricePerKwh: 0.20,
      connectors: ["Type2"],
      isOccupied: false
    });
    console.log("Created station ST-NORM-001");

    const now = new Date();

    // === Session 1: startTime > 2h from now => refund 100% ===
    const farFuture = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3h
    const farFutureEnd = new Date(farFuture.getTime() + 1 * 60 * 60 * 1000); // +1h duration

    const session1 = await Session.create({
      userId: customer._id,
      stationId: station1._id,
      startTime: farFuture,
      endTime: farFutureEnd,
      energyEstimate: 15,
      totalCost: 5.25,
      status: "pending"
    });
    console.log("Session 1 (100% refund test): _id =", session1._id, "| startTime =", farFuture.toISOString());

    // === Session 2: startTime < 2h from now => refund 70% ===
    const nearFuture = new Date(now.getTime() + 30 * 60 * 1000); // +30min
    const nearFutureEnd = new Date(nearFuture.getTime() + 1 * 60 * 60 * 1000);

    const session2 = await Session.create({
      userId: customer._id,
      stationId: station1._id,
      startTime: nearFuture,
      endTime: nearFutureEnd,
      energyEstimate: 15,
      totalCost: 5.25,
      status: "pending"
    });
    console.log("Session 2 (70% refund test): _id =", session2._id, "| startTime =", nearFuture.toISOString());

    // === Session 3: startTime is in the past => cannot cancel ===
    const pastTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // -1h
    const pastEnd = new Date(pastTime.getTime() + 1 * 60 * 60 * 1000);

    const session3 = await Session.create({
      userId: customer._id,
      stationId: station2._id,
      startTime: pastTime,
      endTime: pastEnd,
      energyEstimate: 15,
      totalCost: 5.25,
      status: "pending"
    });
    console.log("Session 3 (cannot cancel - past): _id =", session3._id, "| startTime =", pastTime.toISOString());

    // === Session 4: already cancelled (for edge case test) ===
    const anotherFuture = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const anotherFutureEnd = new Date(anotherFuture.getTime() + 1 * 60 * 60 * 1000);

    const session4 = await Session.create({
      userId: customer._id,
      stationId: station2._id,
      startTime: anotherFuture,
      endTime: anotherFutureEnd,
      energyEstimate: 15,
      totalCost: 5.25,
      status: "cancelled"
    });
    console.log("Session 4 (already cancelled - edge case): _id =", session4._id);

    // === Session 5: active session for extend test (currently in progress) ===
    const activeStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
    const activeEnd = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now

    const session5 = await Session.create({
      userId: customer._id,
      stationId: station1._id,
      startTime: activeStart,
      endTime: activeEnd,
      energyEstimate: 22.5, // 1.5h * 15kWh
      totalCost: 5.51, // ~22.5 * 0.35
      status: "active"
    });
    console.log("Session 5 (active - extend test): _id =", session5._id, "| endTime =", activeEnd.toISOString());

    // === Session 6: active session on same station for overlap test ===
    const overlapStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h from now
    const overlapEnd = new Date(overlapStart.getTime() + 2 * 60 * 60 * 1000); // 2h duration

    const session6 = await Session.create({
      userId: customer._id,
      stationId: station1._id,
      startTime: overlapStart,
      endTime: overlapEnd,
      energyEstimate: 30,
      totalCost: 7.35,
      status: "active"
    });
    console.log("Session 6 (active - overlap test): _id =", session6._id, "| startTime =", overlapStart.toISOString(), "| endTime =", overlapEnd.toISOString());

    console.log("\n=== SEED COMPLETE ===");
    console.log("Customer user1 balance:", customer.balance);
    console.log("\nCopy these session IDs for Postman testing:");
    console.log("  Session 1 (100% refund - 3h away):", session1._id);
    console.log("  Session 2 (70% refund - 30min away):", session2._id);
    console.log("  Session 3 (cannot cancel - past):", session3._id);
    console.log("  Session 4 (already cancelled):", session4._id);
    console.log("  Session 5 (active - extend test):", session5._id);
    console.log("  Session 6 (active - overlap test):", session6._id);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedTestData();
