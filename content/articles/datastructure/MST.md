---
title: MST
date: 2026-07-10
updated_at: 2026-09-06 19:55
tags:
  - datastructure
  - mst
  - spanning-tree
  - concept
description: 무방향 가중치 그래프에서 모든 정점을 가중치의 합이 최소가 되도록 연결하는 최소 신장 트리(MST) 개념
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/MST-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/MST-script.mp3
---

## Minimum Cost Spanning Tree

- MST 는 최소비용 신장트리이며 Minimum Cost Spanning Tree 의 약자입니다.
- Spanning Tree(신장트리) 는 모든 Vertext(정점)이 간선으로 연결되어있고 `Edge 의 개수가 Vertext 개수보다 하나 적은 그래프` 를 의미합니다.
- 신장트리 (Spanning Tree) 는 모든 정점이 연결되어있는 `무방향 연결그래프의 부분 그래프` 여야 합니다.  
  다시 말해, 연결그래프가 주어졌을 때 `정점의 개수 - 1`(Cycle 이 존재하지 않음) 개의 간선으로 `모든 정점을 연결`(모든 정점을 포함)할 수 있는 부분 그래프를 의미합니다.  
- 연결그래프가 주어졌을 때 생성할 수 있는 신장트리는 유일하지 않습니다.  
    
