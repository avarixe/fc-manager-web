/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const TeamsLazyImport = createFileRoute('/teams')()
const IndexLazyImport = createFileRoute('/')()

// Create/Update Routes

const TeamsLazyRoute = TeamsLazyImport.update({
  path: '/teams',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/teams.lazy').then((d) => d.Route))

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/teams': {
      id: '/teams'
      path: '/teams'
      fullPath: '/teams'
      preLoaderRoute: typeof TeamsLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/teams': typeof TeamsLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/teams': typeof TeamsLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/teams': typeof TeamsLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/teams'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/teams'
  id: '__root__' | '/' | '/teams'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  TeamsLazyRoute: typeof TeamsLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  TeamsLazyRoute: TeamsLazyRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/teams"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/teams": {
      "filePath": "teams.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */