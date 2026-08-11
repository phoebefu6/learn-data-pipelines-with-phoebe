# learn-data-pipelines-with-phoebe - official course map

Built 2026-08-11 from verified official sources (course-taking loop paused - built direct).
Bucket: deng (on-ramp, difficulty 1). Single track, 6 plain-English sessions, no code.
Running case: **Daybreak** (coffee-subscription brand - the deng-bucket canon case, shared with
learn-data-warehouse). One order record - order #8412, a $42 gift bundle bought at 11:41pm -
travels from the checkout app to the Monday 9am revenue dashboard.

## Positioning vs siblings

- **learn-data-warehouse** (deng d3): teaches the STORAGE box in depth. This course walks the
  whole conveyor belt past it. Pointer on sessions 3 and 6.
- **learn-data-engineering** (deng d4): the builder capstone. This course is the door.
- **learn-data-literacy** (data d1): teaches reading the dashboard; this course teaches how the
  number GOT there. Complementary, cross-linked.

## Source universe (fetched 2026-08-11, URLs verified by research agent)

1. **DeepLearning.AI Data Engineering Professional Certificate** (Joe Reis) - 4 courses.
   Spine = the data engineering lifecycle: generation -> ingestion -> storage -> transformation
   -> serving, plus undercurrents (security, orchestration, DataOps).
   https://www.deeplearning.ai/courses/data-engineering/
2. **DataCamp "Understanding Data Engineering"** - 2h11m, no-code; closest analog to this course.
   Ch1 what is DE / Ch2 storing (SQL, warehouse vs lake) / Ch3 moving + processing (batch vs
   streaming, scheduling, cloud). https://www.datacamp.com/courses/understanding-data-engineering
3. **IBM "Introduction to Data Engineering"** (Coursera) - roles + ecosystem + lifecycle + careers.
   https://www.coursera.org/learn/introduction-to-data-engineering
4. **dbt Fundamentals** (learn.getdbt.com, free) - Models / Sources / Tests / Documentation /
   Deployment chapters; source-freshness + the 4 built-in tests.
   https://learn.getdbt.com/courses/dbt-fundamentals
5. **Astronomer Academy "Airflow 101"** - orchestration, DAGs, scheduling, debugging.
   https://academy.astronomer.io/path/airflow-101

## Verified fact base (each confirmed with URL by the research pass)

| Fact | Status | Source |
|---|---|---|
| ETL vs ELT; cheap cloud storage shifted industry to ELT (storage "from ~$1M to cents per GB") | Confirmed | fivetran.com/blog/etl-vs-elt |
| Batch = scheduled runs, "often nightly or hourly" (NOT a universal standard - phrase softly); streaming = continuous | Confirmed w/ nuance | aws.amazon.com/what-is/batch-processing/ |
| Medallion bronze/silver/gold = Databricks terminology; bronze as-is, silver cleansed/merged, gold consumption-ready | Confirmed | databricks.com/glossary/medallion-architecture |
| Top pipeline-failure causes: upstream schema change (most common), late data, expired credentials, bad deploys; pipelines can report success and deliver zero rows | Confirmed | hevodata.com/learn/data-pipeline-failures/ |
| dbt source freshness = recency vs SLA with warn/error thresholds; exactly 4 built-in generic tests: unique, not_null, accepted_values, relationships | Confirmed | docs.getdbt.com/docs/build/data-tests |
| Modern stack layer map: Fivetran/Airbyte -> Snowflake/BigQuery/Redshift/Databricks -> dbt -> Airflow/Dagster -> Looker/Tableau/Power BI | Confirmed | atlan.com/modern-data-stack-101 |
| ~40% of data professionals' day spent on data quality; avg 4h to detect, ~9h to resolve, ~61 incidents/month - cite as "a 2022 Monte Carlo/Wakefield survey" | Confirmed, date-stamp it | businesswire.com 2022-08-09 Monte Carlo survey |

## Session map + coverage

| # | Session | Covers | Sources |
|---|---------|--------|---------|
| 1 | Follow the order | What a pipeline is; the 6-stage journey (source -> ingest -> warehouse -> transform -> metrics -> dashboard); why the hand-made spreadsheet era breaks; the lifecycle spine | DLAI lifecycle ✓, DataCamp ch1 ✓, IBM m1 ◐ |
| 2 | Where data is born | Source types (app DB, events/clicks, files, third-party APIs); ingestion; batch vs streaming; Fivetran/Airbyte decoded | DLAI course 2 ◐, DataCamp ch3 ✓, AWS batch ✓ |
| 3 | The cleanup room | Warehouse in one paragraph (pointer to learn-data-warehouse); raw -> clean -> ready layering (bronze/silver/gold decoded); ETL vs ELT story; dbt decoded | DLAI course 3-4 ◐, Databricks medallion ✓, Fivetran ELT ✓, dbt Fundamentals ◐ |
| 4 | The last mile | Serving: dashboards, metric definitions, alerts, ML/AI as consumers; freshness expectations; scheduling/orchestration in plain words (Airflow decoded) | DLAI serving ✓, Airflow 101 ◐, DataCamp ch3 ✓ |
| 5 | When pipelines break | Failure taxonomy (schema change, late data, credentials, bad deploy); STALE vs WRONG; freshness checks + data tests; the 40% firefighting stat; flow-live.js floor | Hevo failures ✓, dbt tests ✓, Monte Carlo survey ✓ |
| 6 | People, tools, next steps | Roles (data engineer / analytics engineer / analyst); tool-name decoder table; how to ask your data team for data; the deng ladder upward | IBM roles ✓, Atlan stack map ✓, hub cross-links |

Legend: ✓ = taught to the 80% bar for this audience · ◐ = introduced in plain English, depth
stays with the source / the sibling course.

## Honestly NOT covered (by design - this is a no-code on-ramp)

- Writing any SQL, Python, or dbt code (-> learn-sql, learn-data-engineering)
- Dimensional modeling, star schemas (-> learn-data-warehouse, learn-data-modeling)
- Setting up Airflow/Dagster, DAG authoring (-> Astronomer Academy)
- Streaming architectures in depth (Kafka etc.) - named, not taught
- Cloud platform specifics (AWS/GCP/Azure services)
- Certificates/assessments stay with the official providers

## Simulator canon (flow-live.js - verified live in-browser 2026-08-11 BEFORE fan-out)

- Healthy day: **$18,240** fresh at 6:05am. Stale fallback (yesterday): **$17,980**.
- Wrong-number failures: source promo-code text bug **$9,120** · transform bad SQL **$3,648** ·
  metrics definition drift **$21,890** (counts refunds).
- STALE failures (ingest credential, warehouse quota, dashboard old table) show $17,980 looking
  normal; freshness badge exposes them.
- WRONG failures pass every freshness check; only data tests catch them (block publish).
- Week mode ladder (fixed 3-incident week: Tue ingest STALE, Thu transform WRONG, Sat dashboard
  STALE): no levers **0/3 caught, 6 blind days** -> +freshness **2/3, 2** -> +tests **3/3, 0**
  (tests alone: 1/3, 4).
- Honesty rail on the widget: teaching simulation, scripted from real incident patterns.
