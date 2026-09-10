"""Reproducible analysis for the Zimran IT School partner case.

The source workbook mixes raw click-level observations with two decision tables.
This module keeps the two economic viewpoints separate:

* zimran.test: projected six-month user income versus affiliate traffic cost;
* traffic partner: affiliate payout received versus media spend.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path

import pandas as pd


TARGET_COUNTRIES = {
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "New Zealand",
}
MOBILE_OS = {"Android", "iOS", "Blackberry", "Windows Phone"}
CAMPAIGNS = ["1_desktop", "1_mobile", "2_cpc"]

PAYOUT = {"1_desktop": 9.00, "1_mobile": 3.50, "2_cpc": 0.33}
ARPU_WEEK0 = {"1_desktop": 0.89, "1_mobile": 1.81, "2_cpc": 0.33}
ARPPU_WEEK0 = {"1_desktop": 44.88, "1_mobile": 150.44, "2_cpc": 31.21}
IMPRESSIONS = {"1_desktop": 413_596, "1_mobile": 601_127, "2_cpc": 140_325}
PARTNER_CPM = {"1_desktop": 6.40, "1_mobile": 2.34}
PARTNER_CPC = {"2_cpc": 0.23}
RETURN_MULTIPLIER = {"desktop": 8.3, "mobile": 4.0}


@dataclass(frozen=True)
class AuditResult:
    rows: int
    duplicate_click_ids: int
    duplicate_profile_ids: int
    registered_rows: int
    unregistered_rows: int
    invalid_registered_demographics: int
    unknown_partner_rows: int
    unknown_os_rows: int


def load_click_data(path: Path) -> pd.DataFrame:
    """Read the click table and normalize types without inventing missing values."""
    frame = pd.read_excel(path, sheet_name="Data", header=1, usecols="A:G")
    frame.columns = [str(column).strip() for column in frame.columns]
    frame["partner_id"] = frame["partner_id"].astype("string").str.strip()
    frame["country"] = frame["country"].astype("string").str.strip()
    frame["gender"] = frame["gender"].astype("string").str.strip().str.lower()
    frame["OS"] = frame["OS"].astype("string").str.strip()
    frame["age"] = pd.to_numeric(frame["age"], errors="coerce")
    return frame


def classify_device(os_name: str) -> str:
    return "mobile" if os_name in MOBILE_OS else "desktop"


def add_features(frame: pd.DataFrame) -> pd.DataFrame:
    enriched = frame.copy()
    enriched["registered"] = enriched["profile_id"].notna()
    enriched["device"] = enriched["OS"].map(classify_device)
    enriched["qualified_lead"] = (
        enriched["registered"]
        & enriched["gender"].eq("male")
        & enriched["age"].ge(35)
        & enriched["country"].isin(TARGET_COUNTRIES)
    )
    return enriched


def audit_data(frame: pd.DataFrame) -> AuditResult:
    registered = frame["profile_id"].notna()
    known_os = frame["OS"].isin(
        MOBILE_OS | {"Windows 10", "Windows 8.1", "Windows 8", "Windows 7", "Windows XP", "MAC OS", "Linux"}
    )
    invalid_demo = registered & (frame["age"].isna() | frame["gender"].isna())
    return AuditResult(
        rows=len(frame),
        duplicate_click_ids=int(frame["click_id"].duplicated().sum()),
        duplicate_profile_ids=int(frame.loc[registered, "profile_id"].duplicated().sum()),
        registered_rows=int(registered.sum()),
        unregistered_rows=int((~registered).sum()),
        invalid_registered_demographics=int(invalid_demo.sum()),
        unknown_partner_rows=int((~frame["partner_id"].isin(CAMPAIGNS)).sum()),
        unknown_os_rows=int((~known_os).sum()),
    )


def wilson_interval(successes: int, trials: int, alpha: float = 0.05) -> tuple[float, float]:
    if trials == 0:
        return (math.nan, math.nan)
    if alpha != 0.05:
        raise ValueError("Only the documented 95% Wilson interval is supported")
    z = 1.959963984540054
    p = successes / trials
    denominator = 1 + z**2 / trials
    centre = (p + z**2 / (2 * trials)) / denominator
    margin = z * math.sqrt((p * (1 - p) / trials) + z**2 / (4 * trials**2)) / denominator
    return centre - margin, centre + margin


def two_proportion_pvalue(success_a: int, total_a: int, success_b: int, total_b: int) -> float:
    pooled = (success_a + success_b) / (total_a + total_b)
    standard_error = math.sqrt(pooled * (1 - pooled) * (1 / total_a + 1 / total_b))
    if standard_error == 0:
        return 1.0
    z_score = (success_a / total_a - success_b / total_b) / standard_error
    return math.erfc(abs(z_score) / math.sqrt(2))


def summarize_campaigns(frame: pd.DataFrame) -> pd.DataFrame:
    records: list[dict[str, float | int | str]] = []
    for campaign in CAMPAIGNS:
        group = frame.loc[frame["partner_id"].eq(campaign)]
        registered = group.loc[group["registered"]]
        clicks = len(group)
        registrations = len(registered)
        leads = int(group["qualified_lead"].sum())
        income_week0 = registrations * ARPU_WEEK0[campaign]
        income_6m = sum(
            int(registered["device"].eq(device).sum())
            * ARPU_WEEK0[campaign]
            * multiplier
            for device, multiplier in RETURN_MULTIPLIER.items()
        )
        traffic_cost = leads * PAYOUT[campaign] if campaign.startswith("1_") else clicks * PAYOUT[campaign]
        client_roi = (income_6m - traffic_cost) / traffic_cost

        if campaign in PARTNER_CPM:
            partner_budget = IMPRESSIONS[campaign] * PARTNER_CPM[campaign] / 1_000
        else:
            partner_budget = clicks * PARTNER_CPC[campaign]
        affiliate_income = traffic_cost
        partner_profit = affiliate_income - partner_budget
        partner_roi = partner_profit / partner_budget

        conversion = registrations / clicks
        low, high = wilson_interval(registrations, clicks)
        paid_users_estimate = round(income_week0 / ARPPU_WEEK0[campaign])
        weighted_multiplier = income_6m / income_week0

        records.append(
            {
                "campaign": campaign,
                "clicks": clicks,
                "registrations": registrations,
                "leads": leads,
                "landing_conversion": conversion,
                "conversion_ci_low": low,
                "conversion_ci_high": high,
                "lead_quality": leads / registrations,
                "estimated_paying_users": paid_users_estimate,
                "income_week0": income_week0,
                "weighted_return_multiplier": weighted_multiplier,
                "income_6m": income_6m,
                "client_traffic_cost": traffic_cost,
                "client_roi": client_roi,
                "client_break_even_unit_payout": income_6m / (leads if campaign.startswith("1_") else clicks),
                "impressions": IMPRESSIONS[campaign],
                "partner_ctr": clicks / IMPRESSIONS[campaign],
                "partner_budget": partner_budget,
                "affiliate_income": affiliate_income,
                "partner_profit": partner_profit,
                "partner_roi": partner_roi,
                "partner_break_even_media_rate": (
                    affiliate_income / IMPRESSIONS[campaign] * 1_000
                    if campaign in PARTNER_CPM
                    else affiliate_income / clicks
                ),
            }
        )
    return pd.DataFrame.from_records(records).set_index("campaign")


def pairwise_conversion_tests(summary: pd.DataFrame) -> pd.DataFrame:
    pairs = [("1_desktop", "1_mobile"), ("1_desktop", "2_cpc"), ("1_mobile", "2_cpc")]
    rows = []
    for first, second in pairs:
        p_value = two_proportion_pvalue(
            int(summary.loc[first, "registrations"]),
            int(summary.loc[first, "clicks"]),
            int(summary.loc[second, "registrations"]),
            int(summary.loc[second, "clicks"]),
        )
        rows.append(
            {
                "campaign_a": first,
                "campaign_b": second,
                "difference_pp": 100
                * (summary.loc[first, "landing_conversion"] - summary.loc[second, "landing_conversion"]),
                "p_value": p_value,
                "significant_at_5pct": p_value < 0.05,
            }
        )
    return pd.DataFrame(rows)


def scenario_table(summary: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for campaign, record in summary.iterrows():
        current_rate = PAYOUT[campaign] if campaign.startswith("1_") else PAYOUT[campaign]
        break_even = record["client_break_even_unit_payout"]
        rows.append(
            {
                "campaign": campaign,
                "client_current_rate": current_rate,
                "client_break_even_rate": break_even,
                "client_rate_headroom": break_even / current_rate - 1,
                "partner_current_media_rate": PARTNER_CPM.get(campaign, PARTNER_CPC.get(campaign)),
                "partner_break_even_media_rate": record["partner_break_even_media_rate"],
                "partner_rate_headroom": record["partner_break_even_media_rate"]
                / PARTNER_CPM.get(campaign, PARTNER_CPC.get(campaign))
                - 1,
            }
        )
    return pd.DataFrame(rows).set_index("campaign")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/raw/zimran_source.xlsx"))
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/analysis"))
    args = parser.parse_args()

    raw = load_click_data(args.input)
    enriched = add_features(raw)
    audit = audit_data(enriched)
    summary = summarize_campaigns(enriched)
    tests = pairwise_conversion_tests(summary)
    scenarios = scenario_table(summary)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    summary.to_csv(args.output_dir / "campaign_summary.csv", float_format="%.8f")
    tests.to_csv(args.output_dir / "conversion_tests.csv", index=False, float_format="%.8g")
    scenarios.to_csv(args.output_dir / "break_even_scenarios.csv", float_format="%.8f")
    (args.output_dir / "data_audit.json").write_text(
        json.dumps(asdict(audit), indent=2), encoding="utf-8"
    )

    print(summary.round(4).to_string())
    print("\nPairwise conversion tests")
    print(tests.to_string(index=False))
    print("\nData audit")
    print(json.dumps(asdict(audit), indent=2))


if __name__ == "__main__":
    main()
