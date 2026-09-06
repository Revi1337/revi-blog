---
title: Spanning Tree
date: 2026-07-09
updated_at: 2026-09-06 19:55
tags:
  - datastructure
  - spanning-tree
  - graph
  - concept
description: 무방향 연결 그래프의 모든 정점을 사이클 없이 (V-1)개 간선으로 연결하는 신장 트리(Spanning Tree) 개념
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/SpanningTree-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/SpanningTree-script.mp3
---

## Spanning Tree

- Spanning Tree(신장트리) 는 모든 Vertext(정점)이 간선으로 연결되어있고 `Edge 의 개수가 Vertext 개수보다 하나 적은 그래프` 를 의미합니다.
- 신장트리 (Spanning Tree) 는 모든 정점이 연결되어있는 `무방향 연결그래프의 부분 그래프` 여야 합니다.  
  다시 말해, 연결그래프가 주어졌을 때 `정점의 개수 - 1`(Cycle 이 존재하지 않음) 개의 간선으로 `모든 정점을 연결`(모든 정점을 포함)할 수 있는 부분 그래프를 의미합니다.  
- 연결그래프가 주어졌을 때 생성할 수 있는 신장트리는 유일하지 않습니다.  
    
> 연결관계에서 Cycle 을 형성하지 않기 때문에 트리의 기본 조건을 갖고 있다고 볼 수 있으며 Spanning Tree 의 간선의 개수는 (정점의 개수 - 1) 가 됩니다.



