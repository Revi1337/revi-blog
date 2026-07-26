---
title: "Optimizing PostgreSQL Indexing for High-Write Loads"
date: "2024-03-15"
tags: ["postgreSQL", "indexing"]
thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4grybCOZJ8iDvAq1Io97iQ0fvkNsLKzLL7JVplr_eNnd7Q1xjPKM3l5k7QZ56xcUNn4-lrkH3f5DP_fTkNl1hD_2AiNNcH-UOPuJMHCaXfyoTjgIQTIQ2tjRuDC2e5gdswFaG8kbpaHlobZeovPROItTv5oezjZ_DqNFIQH2nw9GdgzSu_c3Nk1FWESB-kipXQhCOsGt7eAR9IVqN8cBMlMhq-xB65e9z5dRAhcfOim4rp-axyS0s"
reading_time_minutes: 8
---

## Overview

High-write workloads punish naive indexing strategies. This post walks through partial indexes, fill-factor tuning, and write-amplification tradeoffs we hit in production.
