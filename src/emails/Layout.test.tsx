import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import { Layout } from "./Layout";

describe("email Layout", () => {
  it("renders Spanish HTML with brand, preview and footer", async () => {
    const html = await render(
      <Layout preview="Vista previa">
        <p>Hola</p>
      </Layout>,
    );
    expect(html).toContain('lang="es-MX"');
    expect(html).toContain("Colore");
    expect(html).toMatch(/src="https?:\/\/[^"]+\/brand\/colore-logo\.jpg"/);
    expect(html).toContain("Vista previa");
    expect(html).toContain("Hola");
    expect(html).toContain("Mexicali");
  });
});
