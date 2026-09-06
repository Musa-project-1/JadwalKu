import { idDocs } from "./featureDocs/id.js"
import { enDocs } from "./featureDocs/en.js"
import { adminDocs } from "./featureDocs/adminDocs.js"

export const FEATURE_DOCS_TRANSLATIONS = {
  id: idDocs,
  en: enDocs,
}

export { adminDocs }

export function getFeatureDocs(language = "id") {
  return FEATURE_DOCS_TRANSLATIONS[language] || FEATURE_DOCS_TRANSLATIONS.id
}
