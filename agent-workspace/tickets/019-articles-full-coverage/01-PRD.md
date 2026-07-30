# PRD — Ticket 019: Articles Full Language Coverage

## Problem

Many article rows have one or more locales not `PUBLISHED` (often empty titles and content). Users hitting `/{locale}/articles/{slug}` are redirected to the article index instead of seeing content.

## Goal

Fill **title, content (HTML), excerpt, focus keyword, meta title/description, OG title/description** for every missing locale so **en / he / ar** are all **PUBLISHED** where applicable, preserving CTA links to `/{locale}/destinations/{code}` (or root `/destinations/{code}` for English per existing site pattern) and matching established HTML structure.

## Non-goals

- No schema changes
- No new npm dependencies
- Do not overwrite existing non-empty locale fields

## Success criteria

- Coverage script reports **0** articles with any locale not `PUBLISHED` (or only intentional exceptions documented in DIP)
- Sample URLs open with content in each locale without redirect to `/articles`
