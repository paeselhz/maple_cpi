from utils import DataExtraction

de = DataExtraction()

de.download_boc_rates()

de.download_cpi()

de.download_government_bonds()

de.boc_rates.to_parquet("data/boc_rates.parquet")

de.cpi.to_parquet("data/cpi.parquet")

de.gvt_bonds.to_parquet("data/gvt_bonds.parquet")

de.clean()
