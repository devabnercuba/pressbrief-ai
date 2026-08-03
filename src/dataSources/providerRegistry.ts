// Provider Registry — registrar um novo provider não exige alteração em
// nenhuma outra parte do sistema.
import type { DataSourceProvider, DataSourceType } from "./dataSourceTypes";
import { apiProvider } from "./providers/apiProvider";
import { excelProvider } from "./providers/excelProvider";
import { jsonProvider } from "./providers/jsonProvider";
import { manualProvider } from "./providers/manualProvider";
import { pdfProvider } from "./providers/pdfProvider";
import { rssProvider } from "./providers/rssProvider";
import { urlProvider } from "./providers/urlProvider";

export class ProviderRegistry {
  private providers = new Map<DataSourceType, DataSourceProvider>();

  register(provider: DataSourceProvider): this {
    this.providers.set(provider.type, provider);
    return this;
  }

  unregister(type: DataSourceType): void {
    this.providers.delete(type);
  }

  get(type: DataSourceType): DataSourceProvider | undefined {
    return this.providers.get(type);
  }

  has(type: DataSourceType): boolean {
    return this.providers.has(type);
  }

  list(): DataSourceProvider[] {
    return Array.from(this.providers.values());
  }
}

export const providerRegistry = new ProviderRegistry();

[apiProvider, urlProvider, excelProvider, pdfProvider, rssProvider, jsonProvider, manualProvider].forEach(
  (provider) => providerRegistry.register(provider),
);
