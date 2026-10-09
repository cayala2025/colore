// Remember when this run started, so teardown deletes exactly the rows created by it.
export default async function globalSetup() {
  process.env.TEST_RUN_STARTED_AT = new Date().toISOString();
}
