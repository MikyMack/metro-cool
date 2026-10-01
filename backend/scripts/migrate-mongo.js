const { MongoClient } = require("mongoose").mongo;

const SOURCE_URI = process.env.SOURCE_MONGO_URI;
const TARGET_URI = process.env.TARGET_MONGO_URI;
const TARGET_DB = process.env.TARGET_DB_NAME;
const DROP = process.argv.includes("--drop");
const BATCH_SIZE = 1000;

async function copyCollection(sourceDb, targetDb, name) {
  const source = sourceDb.collection(name);
  const target = targetDb.collection(name);

  const existing = await target.estimatedDocumentCount();
  if (existing > 0) {
    if (!DROP) {
      console.log(`  ${name}: skipped (target already has ${existing} docs, use --drop to overwrite)`);
      return;
    }
    await target.drop();
  }

  let batch = [];
  let copied = 0;
  for await (const doc of source.find()) {
    batch.push(doc);
    if (batch.length === BATCH_SIZE) {
      await target.insertMany(batch, { ordered: false });
      copied += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await target.insertMany(batch, { ordered: false });
    copied += batch.length;
  }

  const indexes = await source.indexes();
  for (const { key, name: indexName, v, ns, ...options } of indexes) {
    if (indexName === "_id_") continue;
    await target.createIndex(key, { name: indexName, ...options });
  }

  console.log(`  ${name}: ${copied} docs, ${indexes.length - 1} indexes`);
}

async function main() {
  if (!SOURCE_URI || !TARGET_URI) {
    console.error("Set SOURCE_MONGO_URI and TARGET_MONGO_URI");
    process.exit(1);
  }

  const sourceClient = await MongoClient.connect(SOURCE_URI);
  const targetClient = await MongoClient.connect(TARGET_URI);

  try {
    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db(TARGET_DB || sourceDb.databaseName);
    console.log(`Copying ${sourceDb.databaseName} -> ${targetDb.databaseName}`);

    const collections = await sourceDb
      .listCollections({ type: "collection" }, { nameOnly: true })
      .toArray();

    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;
      await copyCollection(sourceDb, targetDb, name);
    }
    console.log("Done");
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
