/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()
const TeamsIndexLazyImport = createFileRoute('/teams/')()
const TeamsNewLazyImport = createFileRoute('/teams/new')()

// Create/Update Routes

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const TeamsIndexLazyRoute = TeamsIndexLazyImport.update({
  path: '/teams/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/teams.index.lazy').then((d) => d.Route))

const TeamsNewLazyRoute = TeamsNewLazyImport.update({
  path: '/teams/new',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/teams.new.lazy').then((d) => d.Route))

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
    '/teams/new': {
      id: '/teams/new'
      path: '/teams/new'
      fullPath: '/teams/new'
      preLoaderRoute: typeof TeamsNewLazyImport
      parentRoute: typeof rootRoute
    }
    '/teams/': {
      id: '/teams/'
      path: '/teams'
      fullPath: '/teams'
      preLoaderRoute: typeof TeamsIndexLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/teams/new': typeof TeamsNewLazyRoute
  '/teams': typeof TeamsIndexLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/teams/new': typeof TeamsNewLazyRoute
  '/teams': typeof TeamsIndexLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/teams/new': typeof TeamsNewLazyRoute
  '/teams/': typeof TeamsIndexLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/teams/new' | '/teams'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/teams/new' | '/teams'
  id: '__root__' | '/' | '/teams/new' | '/teams/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  TeamsNewLazyRoute: typeof TeamsNewLazyRoute
  TeamsIndexLazyRoute: typeof TeamsIndexLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  TeamsNewLazyRoute: TeamsNewLazyRoute,
  TeamsIndexLazyRoute: TeamsIndexLazyRoute,
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
        "/teams/new",
        "/teams/"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/teams/new": {
      "filePath": "teams.new.lazy.tsx"
    },
    "/teams/": {
      "filePath": "teams.index.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
