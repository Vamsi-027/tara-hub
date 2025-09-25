import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Comprehensive list of countries
const COUNTRIES = [
  { iso_2: "us", iso_3: "usa", num_code: "840", name: "United States", display_name: "United States" },
  { iso_2: "ca", iso_3: "can", num_code: "124", name: "Canada", display_name: "Canada" },
  { iso_2: "gb", iso_3: "gbr", num_code: "826", name: "United Kingdom", display_name: "United Kingdom" },
  { iso_2: "de", iso_3: "deu", num_code: "276", name: "Germany", display_name: "Germany" },
  { iso_2: "fr", iso_3: "fra", num_code: "250", name: "France", display_name: "France" },
  { iso_2: "es", iso_3: "esp", num_code: "724", name: "Spain", display_name: "Spain" },
  { iso_2: "it", iso_3: "ita", num_code: "380", name: "Italy", display_name: "Italy" },
  { iso_2: "nl", iso_3: "nld", num_code: "528", name: "Netherlands", display_name: "Netherlands" },
  { iso_2: "be", iso_3: "bel", num_code: "056", name: "Belgium", display_name: "Belgium" },
  { iso_2: "at", iso_3: "aut", num_code: "040", name: "Austria", display_name: "Austria" },
  { iso_2: "se", iso_3: "swe", num_code: "752", name: "Sweden", display_name: "Sweden" },
  { iso_2: "no", iso_3: "nor", num_code: "578", name: "Norway", display_name: "Norway" },
  { iso_2: "dk", iso_3: "dnk", num_code: "208", name: "Denmark", display_name: "Denmark" },
  { iso_2: "fi", iso_3: "fin", num_code: "246", name: "Finland", display_name: "Finland" },
  { iso_2: "ch", iso_3: "che", num_code: "756", name: "Switzerland", display_name: "Switzerland" },
  { iso_2: "au", iso_3: "aus", num_code: "036", name: "Australia", display_name: "Australia" },
  { iso_2: "nz", iso_3: "nzl", num_code: "554", name: "New Zealand", display_name: "New Zealand" },
  { iso_2: "jp", iso_3: "jpn", num_code: "392", name: "Japan", display_name: "Japan" },
  { iso_2: "kr", iso_3: "kor", num_code: "410", name: "South Korea", display_name: "South Korea" },
  { iso_2: "cn", iso_3: "chn", num_code: "156", name: "China", display_name: "China" },
  { iso_2: "in", iso_3: "ind", num_code: "356", name: "India", display_name: "India" },
  { iso_2: "br", iso_3: "bra", num_code: "076", name: "Brazil", display_name: "Brazil" },
  { iso_2: "mx", iso_3: "mex", num_code: "484", name: "Mexico", display_name: "Mexico" },
  { iso_2: "ar", iso_3: "arg", num_code: "032", name: "Argentina", display_name: "Argentina" },
  { iso_2: "za", iso_3: "zaf", num_code: "710", name: "South Africa", display_name: "South Africa" },
  { iso_2: "sg", iso_3: "sgp", num_code: "702", name: "Singapore", display_name: "Singapore" },
  { iso_2: "hk", iso_3: "hkg", num_code: "344", name: "Hong Kong", display_name: "Hong Kong" },
  { iso_2: "ae", iso_3: "are", num_code: "784", name: "United Arab Emirates", display_name: "United Arab Emirates" },
  { iso_2: "sa", iso_3: "sau", num_code: "682", name: "Saudi Arabia", display_name: "Saudi Arabia" },
  { iso_2: "il", iso_3: "isr", num_code: "376", name: "Israel", display_name: "Israel" },
  { iso_2: "ru", iso_3: "rus", num_code: "643", name: "Russia", display_name: "Russia" },
  { iso_2: "pl", iso_3: "pol", num_code: "616", name: "Poland", display_name: "Poland" },
  { iso_2: "pt", iso_3: "prt", num_code: "620", name: "Portugal", display_name: "Portugal" },
  { iso_2: "ie", iso_3: "irl", num_code: "372", name: "Ireland", display_name: "Ireland" },
  { iso_2: "cz", iso_3: "cze", num_code: "203", name: "Czech Republic", display_name: "Czech Republic" },
  { iso_2: "hu", iso_3: "hun", num_code: "348", name: "Hungary", display_name: "Hungary" },
  { iso_2: "ro", iso_3: "rou", num_code: "642", name: "Romania", display_name: "Romania" },
  { iso_2: "gr", iso_3: "grc", num_code: "300", name: "Greece", display_name: "Greece" },
  { iso_2: "tr", iso_3: "tur", num_code: "792", name: "Turkey", display_name: "Turkey" }
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Return all available countries
    res.json({
      countries: COUNTRIES,
      count: COUNTRIES.length
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch countries",
      countries: []
    })
  }
}