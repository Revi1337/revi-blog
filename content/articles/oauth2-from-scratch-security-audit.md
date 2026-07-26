---
title: "Implementing OAuth2 from Scratch: A Security Audit"
category: "SECURITY"
date: "2024-02-10"
reading_time_minutes: 15
tags: ["oAuth2", "security"]
thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBxpHVjULHPGba_D3Zm44udzzMisBU1tgygH8VL8vapQleHh4PxCmGntAIgEyEdPpdqVw8E54gR75P_LUkLnLgjB5m8hFpFtqQYUtedth2fiCWGZCvzO50qBw5bZLexnHHw35UtpclOcT6sCAazUVv0FfIUpWCi8X3KCxF1zSqlBsgUAAyzMrSF-uuu8VwDrDKpWMGpjzO3Sd_7KzjYdNm9ghmujt08UZrk8PHRpGp3DwUYRAzvFkI"
---

## Overview

Rolling your own OAuth2 flow is a minefield. We document every footgun we found during an internal security audit.
