import {defineConfig} from "sanity";
import {structureTool} from "sanity/structure";
import {visionTool} from "@sanity/vision";
import {schemaTypes} from "./schemaTypes/index.js";
import {structure} from "./structure.js";
import {withPermanentSlugLock} from "./actions/lockSlugPublishAction.js";

export default defineConfig({
  name: "sady_editorial",
  title: "Artigos de Sady Santana",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool({structure}), visionTool()],
  schema: {types: schemaTypes},
  document: {
    newDocumentOptions: (items) => items.filter((item) => ["article", "category"].includes(item.templateId)),
    actions: (previousActions, context) => context.schemaType === "article"
      ? previousActions.map((action) => action.action === "publish" ? withPermanentSlugLock(action) : action)
      : previousActions,
  },
});
