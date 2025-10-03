# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application (App Router) bootstrapped with `create-next-app`, using TypeScript, React 19, and Tailwind CSS v4. The project is currently in its initial setup phase with minimal customization.

## Common Commands

- **Development**: `npm run dev` - Starts the development server at http://localhost:3000
- **Production Build**: `npm run build` - Creates an optimized production build
- **Production Server**: `npm start` - Runs the production server (requires build first)
- **Linting**: `npm run lint` or `eslint` - Runs ESLint with Next.js TypeScript configuration

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.1.0
- **TypeScript**: ^5
- **Styling**: Tailwind CSS v4 (using new PostCSS plugin architecture)
- **Fonts**: Geist Sans and Geist Mono (via next/font/google)
- **Linting**: ESLint 9 with Next.js core-web-vitals and TypeScript configs

### Directory Structure
- `app/` - Next.js App Router directory containing pages and layouts
  - `layout.tsx` - Root layout with font configuration and metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global Tailwind CSS styles
- `public/` - Static assets (SVGs, images)
- Path alias `@/*` maps to the project root

### Configuration Files
- `next.config.ts` - Next.js configuration (TypeScript)
- `tsconfig.json` - TypeScript compiler options with strict mode enabled
- `eslint.config.mjs` - ESLint flat config extending Next.js presets
- `postcss.config.mjs` - PostCSS configuration for Tailwind v4

## Development Notes

- TypeScript strict mode is enabled
- Uses ES2017 target with bundler module resolution
- App Router with React Server Components by default
- Tailwind CSS v4 uses the new `@tailwindcss/postcss` plugin architecture
