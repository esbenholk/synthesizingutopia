"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/cloudinary/recent/route";
exports.ids = ["app/api/cloudinary/recent/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fcloudinary%2Frecent%2Froute&page=%2Fapi%2Fcloudinary%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcloudinary%2Frecent%2Froute.ts&appDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fcloudinary%2Frecent%2Froute&page=%2Fapi%2Fcloudinary%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcloudinary%2Frecent%2Froute.ts&appDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_SynthesizingUtopias_utopiaAPI_src_app_api_cloudinary_recent_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/cloudinary/recent/route.ts */ \"(rsc)/./src/app/api/cloudinary/recent/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/cloudinary/recent/route\",\n        pathname: \"/api/cloudinary/recent\",\n        filename: \"route\",\n        bundlePath: \"app/api/cloudinary/recent/route\"\n    },\n    resolvedPagePath: \"D:\\\\SynthesizingUtopias\\\\utopiaAPI\\\\src\\\\app\\\\api\\\\cloudinary\\\\recent\\\\route.ts\",\n    nextConfigOutput,\n    userland: D_SynthesizingUtopias_utopiaAPI_src_app_api_cloudinary_recent_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/cloudinary/recent/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZjbG91ZGluYXJ5JTJGcmVjZW50JTJGcm91dGUmcGFnZT0lMkZhcGklMkZjbG91ZGluYXJ5JTJGcmVjZW50JTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGY2xvdWRpbmFyeSUyRnJlY2VudCUyRnJvdXRlLnRzJmFwcERpcj1EJTNBJTVDU3ludGhlc2l6aW5nVXRvcGlhcyU1Q3V0b3BpYUFQSSU1Q3NyYyU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9RCUzQSU1Q1N5bnRoZXNpemluZ1V0b3BpYXMlNUN1dG9waWFBUEkmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQytCO0FBQzVHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdHJlbmRzLWFpLWdlbmVyYXRvci8/M2RmMSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJEOlxcXFxTeW50aGVzaXppbmdVdG9waWFzXFxcXHV0b3BpYUFQSVxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxjbG91ZGluYXJ5XFxcXHJlY2VudFxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvY2xvdWRpbmFyeS9yZWNlbnQvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9jbG91ZGluYXJ5L3JlY2VudFwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvY2xvdWRpbmFyeS9yZWNlbnQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJEOlxcXFxTeW50aGVzaXppbmdVdG9waWFzXFxcXHV0b3BpYUFQSVxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxjbG91ZGluYXJ5XFxcXHJlY2VudFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvY2xvdWRpbmFyeS9yZWNlbnQvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fcloudinary%2Frecent%2Froute&page=%2Fapi%2Fcloudinary%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcloudinary%2Frecent%2Froute.ts&appDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/cloudinary/recent/route.ts":
/*!************************************************!*\
  !*** ./src/app/api/cloudinary/recent/route.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var cloudinary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! cloudinary */ \"(rsc)/./node_modules/cloudinary/cloudinary.js\");\n/* harmony import */ var cloudinary__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(cloudinary__WEBPACK_IMPORTED_MODULE_1__);\n\n\ncloudinary__WEBPACK_IMPORTED_MODULE_1__.v2.config({\n    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,\n    api_key: process.env.CLOUDINARY_API_KEY,\n    api_secret: process.env.CLOUDINARY_API_SECRET\n});\nconst pick = (obj, kCamel, kSnake)=>obj?.[kCamel] ?? obj?.[kSnake] ?? null;\nfunction escapeCloudinaryValue(v) {\n    return v.replace(/\\\\/g, \"\\\\\\\\\").replace(/\"/g, '\\\\\"');\n}\n// ✅ Split ONLY on commas so multi-word tags (e.g. \"cute dog\") stay intact.\nfunction parseSearchToTags(raw) {\n    if (!raw) return [];\n    return raw.split(\",\").map((s)=>s.trim()).filter(Boolean);\n}\nasync function GET(request) {\n    const url = new URL(request.url);\n    const limit = parseInt(url.searchParams.get(\"limit\") || \"10\", 10);\n    const folder = url.searchParams.get(\"folder\") || \"utopias\";\n    const cursor = url.searchParams.get(\"cursor\") || undefined;\n    const sortParam = (url.searchParams.get(\"sort\") || \"asc\").toLowerCase();\n    const sortOrder = sortParam === \"desc\" ? \"desc\" : \"asc\";\n    const searchRaw = url.searchParams.get(\"search\");\n    const tags = parseSearchToTags(searchRaw);\n    try {\n        const folderExpr = `folder=\"${escapeCloudinaryValue(folder)}\"`;\n        const tagsExpr = tags.length > 0 ? ` AND (${tags.map((t)=>`tags=\"${escapeCloudinaryValue(t)}\"`).join(\" OR \")})` : \"\";\n        const expression = `${folderExpr}${tagsExpr}`;\n        let q = cloudinary__WEBPACK_IMPORTED_MODULE_1__.v2.search.expression(expression).sort_by(\"created_at\", sortOrder).with_field(\"context\").with_field(\"metadata\").with_field(\"tags\").max_results(limit);\n        if (cursor) q = q.next_cursor(cursor);\n        const res = await q.execute();\n        const items = (res.resources || []).map((r)=>{\n            // Cloudinary can return context as either object or { custom: ... }\n            const cx = r.context?.custom ?? r.context ?? {};\n            const md = r.metadata ?? {};\n            const aiTitle = pick(cx, \"aiTitle\", \"ai_title\") ?? pick(md, \"aiTitle\", \"ai_title\");\n            const title = pick(cx, \"caption\", \"caption\") ?? pick(md, \"title\", \"title\") ?? r.public_id?.split(\"/\").pop() ?? \"Untitled\";\n            const alt = pick(cx, \"alt\", \"alt\") ?? pick(md, \"description\", \"description\");\n            // ✅ NEW fields from context\n            const parentIds = pick(cx, \"parentIds\", \"parentIds\"); // stringified JSON in your example\n            const aiStory = pick(cx, \"aiStory\", \"ai_extended_story\") ?? pick(cx, \"ai_extended_story\", \"ai_extended_story\");\n            const aiPolitics = pick(cx, \"aiPolitics\", \"ai_political_state\") ?? pick(cx, \"ai_political_state\", \"ai_political_state\");\n            return {\n                id: r.asset_id ?? r.public_id,\n                public_id: r.public_id,\n                url: r.secure_url ?? r.url,\n                created_at: r.created_at,\n                tags: r.tags ?? [],\n                title,\n                aiTitle,\n                alt,\n                // ✅ include these in client payload\n                parentIds,\n                aiStory,\n                aiPolitics\n            };\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            items,\n            nextCursor: res.next_cursor ?? null,\n            sortOrder\n        });\n    } catch (error) {\n        console.error(\"Cloudinary fetch error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to fetch images\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9jbG91ZGluYXJ5L3JlY2VudC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQTJDO0FBQ0c7QUFFOUNFLDBDQUFVQSxDQUFDQyxNQUFNLENBQUM7SUFDaEJDLFlBQVlDLFFBQVFDLEdBQUcsQ0FBQ0MscUJBQXFCO0lBQzdDQyxTQUFTSCxRQUFRQyxHQUFHLENBQUNHLGtCQUFrQjtJQUN2Q0MsWUFBWUwsUUFBUUMsR0FBRyxDQUFDSyxxQkFBcUI7QUFDL0M7QUFFQSxNQUFNQyxPQUFPLENBQUNDLEtBQVVDLFFBQWdCQyxTQUN0Q0YsS0FBSyxDQUFDQyxPQUFPLElBQUlELEtBQUssQ0FBQ0UsT0FBTyxJQUFJO0FBRXBDLFNBQVNDLHNCQUFzQkMsQ0FBUztJQUN0QyxPQUFPQSxFQUFFQyxPQUFPLENBQUMsT0FBTyxRQUFRQSxPQUFPLENBQUMsTUFBTTtBQUNoRDtBQUVBLDJFQUEyRTtBQUMzRSxTQUFTQyxrQkFBa0JDLEdBQWtCO0lBQzNDLElBQUksQ0FBQ0EsS0FBSyxPQUFPLEVBQUU7SUFDbkIsT0FBT0EsSUFDSkMsS0FBSyxDQUFDLEtBQ05DLEdBQUcsQ0FBQyxDQUFDQyxJQUFNQSxFQUFFQyxJQUFJLElBQ2pCQyxNQUFNLENBQUNDO0FBQ1o7QUFFTyxlQUFlQyxJQUFJQyxPQUFnQjtJQUN4QyxNQUFNQyxNQUFNLElBQUlDLElBQUlGLFFBQVFDLEdBQUc7SUFFL0IsTUFBTUUsUUFBUUMsU0FBU0gsSUFBSUksWUFBWSxDQUFDQyxHQUFHLENBQUMsWUFBWSxNQUFNO0lBQzlELE1BQU1DLFNBQVNOLElBQUlJLFlBQVksQ0FBQ0MsR0FBRyxDQUFDLGFBQWE7SUFDakQsTUFBTUUsU0FBU1AsSUFBSUksWUFBWSxDQUFDQyxHQUFHLENBQUMsYUFBYUc7SUFFakQsTUFBTUMsWUFBWSxDQUFDVCxJQUFJSSxZQUFZLENBQUNDLEdBQUcsQ0FBQyxXQUFXLEtBQUksRUFBR0ssV0FBVztJQUNyRSxNQUFNQyxZQUFZRixjQUFjLFNBQVMsU0FBUztJQUVsRCxNQUFNRyxZQUFZWixJQUFJSSxZQUFZLENBQUNDLEdBQUcsQ0FBQztJQUN2QyxNQUFNUSxPQUFPdkIsa0JBQWtCc0I7SUFFL0IsSUFBSTtRQUNGLE1BQU1FLGFBQWEsQ0FBQyxRQUFRLEVBQUUzQixzQkFBc0JtQixRQUFRLENBQUMsQ0FBQztRQUU5RCxNQUFNUyxXQUNKRixLQUFLRyxNQUFNLEdBQUcsSUFDVixDQUFDLE1BQU0sRUFBRUgsS0FDTnBCLEdBQUcsQ0FBQyxDQUFDd0IsSUFBTSxDQUFDLE1BQU0sRUFBRTlCLHNCQUFzQjhCLEdBQUcsQ0FBQyxDQUFDLEVBQy9DQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FDbEI7UUFFTixNQUFNQyxhQUFhLENBQUMsRUFBRUwsV0FBVyxFQUFFQyxTQUFTLENBQUM7UUFFN0MsSUFBSUssSUFBSS9DLDBDQUFVQSxDQUFDZ0QsTUFBTSxDQUN0QkYsVUFBVSxDQUFDQSxZQUNYRyxPQUFPLENBQUMsY0FBY1gsV0FDdEJZLFVBQVUsQ0FBQyxXQUNYQSxVQUFVLENBQUMsWUFDWEEsVUFBVSxDQUFDLFFBQ1hDLFdBQVcsQ0FBQ3RCO1FBRWYsSUFBSUssUUFBUWEsSUFBSUEsRUFBRUssV0FBVyxDQUFDbEI7UUFFOUIsTUFBTW1CLE1BQU0sTUFBTU4sRUFBRU8sT0FBTztRQUUzQixNQUFNQyxRQUFRLENBQUNGLElBQUlHLFNBQVMsSUFBSSxFQUFFLEVBQUVwQyxHQUFHLENBQUMsQ0FBQ3FDO1lBQ3ZDLG9FQUFvRTtZQUNwRSxNQUFNQyxLQUFLRCxFQUFFRSxPQUFPLEVBQUVDLFVBQVVILEVBQUVFLE9BQU8sSUFBSSxDQUFDO1lBQzlDLE1BQU1FLEtBQUtKLEVBQUVLLFFBQVEsSUFBSSxDQUFDO1lBRTFCLE1BQU1DLFVBQ0pyRCxLQUFLZ0QsSUFBSSxXQUFXLGVBQWVoRCxLQUFLbUQsSUFBSSxXQUFXO1lBRXpELE1BQU1HLFFBQ0p0RCxLQUFLZ0QsSUFBSSxXQUFXLGNBQ3BCaEQsS0FBS21ELElBQUksU0FBUyxZQUNsQkosRUFBRVEsU0FBUyxFQUFFOUMsTUFBTSxLQUFLK0MsU0FDeEI7WUFFRixNQUFNQyxNQUNKekQsS0FBS2dELElBQUksT0FBTyxVQUFVaEQsS0FBS21ELElBQUksZUFBZTtZQUVwRCw0QkFBNEI7WUFDNUIsTUFBTU8sWUFBWTFELEtBQUtnRCxJQUFJLGFBQWEsY0FBYyxtQ0FBbUM7WUFDekYsTUFBTVcsVUFDSjNELEtBQUtnRCxJQUFJLFdBQVcsd0JBQ3BCaEQsS0FBS2dELElBQUkscUJBQXFCO1lBQ2hDLE1BQU1ZLGFBQ0o1RCxLQUFLZ0QsSUFBSSxjQUFjLHlCQUN2QmhELEtBQUtnRCxJQUFJLHNCQUFzQjtZQUVqQyxPQUFPO2dCQUNMYSxJQUFJZCxFQUFFZSxRQUFRLElBQUlmLEVBQUVRLFNBQVM7Z0JBQzdCQSxXQUFXUixFQUFFUSxTQUFTO2dCQUN0QnRDLEtBQUs4QixFQUFFZ0IsVUFBVSxJQUFJaEIsRUFBRTlCLEdBQUc7Z0JBQzFCK0MsWUFBWWpCLEVBQUVpQixVQUFVO2dCQUN4QmxDLE1BQU1pQixFQUFFakIsSUFBSSxJQUFJLEVBQUU7Z0JBQ2xCd0I7Z0JBQ0FEO2dCQUNBSTtnQkFFQSxvQ0FBb0M7Z0JBQ3BDQztnQkFDQUM7Z0JBQ0FDO1lBQ0Y7UUFDRjtRQUVBLE9BQU94RSxxREFBWUEsQ0FBQzZFLElBQUksQ0FBQztZQUN2QnBCO1lBQ0FxQixZQUFZdkIsSUFBSUQsV0FBVyxJQUFJO1lBQy9CZDtRQUNGO0lBQ0YsRUFBRSxPQUFPdUMsT0FBTztRQUNkQyxRQUFRRCxLQUFLLENBQUMsMkJBQTJCQTtRQUN6QyxPQUFPL0UscURBQVlBLENBQUM2RSxJQUFJLENBQ3RCO1lBQUVFLE9BQU87UUFBeUIsR0FDbEM7WUFBRUUsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90cmVuZHMtYWktZ2VuZXJhdG9yLy4vc3JjL2FwcC9hcGkvY2xvdWRpbmFyeS9yZWNlbnQvcm91dGUudHM/YzUzMiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB7IHYyIGFzIGNsb3VkaW5hcnkgfSBmcm9tIFwiY2xvdWRpbmFyeVwiO1xuXG5jbG91ZGluYXJ5LmNvbmZpZyh7XG4gIGNsb3VkX25hbWU6IHByb2Nlc3MuZW52LkNMT1VESU5BUllfQ0xPVURfTkFNRSxcbiAgYXBpX2tleTogcHJvY2Vzcy5lbnYuQ0xPVURJTkFSWV9BUElfS0VZLFxuICBhcGlfc2VjcmV0OiBwcm9jZXNzLmVudi5DTE9VRElOQVJZX0FQSV9TRUNSRVQsXG59KTtcblxuY29uc3QgcGljayA9IChvYmo6IGFueSwga0NhbWVsOiBzdHJpbmcsIGtTbmFrZTogc3RyaW5nKSA9PlxuICBvYmo/LltrQ2FtZWxdID8/IG9iaj8uW2tTbmFrZV0gPz8gbnVsbDtcblxuZnVuY3Rpb24gZXNjYXBlQ2xvdWRpbmFyeVZhbHVlKHY6IHN0cmluZykge1xuICByZXR1cm4gdi5yZXBsYWNlKC9cXFxcL2csIFwiXFxcXFxcXFxcIikucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xufVxuXG4vLyDinIUgU3BsaXQgT05MWSBvbiBjb21tYXMgc28gbXVsdGktd29yZCB0YWdzIChlLmcuIFwiY3V0ZSBkb2dcIikgc3RheSBpbnRhY3QuXG5mdW5jdGlvbiBwYXJzZVNlYXJjaFRvVGFncyhyYXc6IHN0cmluZyB8IG51bGwpIHtcbiAgaWYgKCFyYXcpIHJldHVybiBbXTtcbiAgcmV0dXJuIHJhd1xuICAgIC5zcGxpdChcIixcIilcbiAgICAubWFwKChzKSA9PiBzLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IFJlcXVlc3QpIHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG5cbiAgY29uc3QgbGltaXQgPSBwYXJzZUludCh1cmwuc2VhcmNoUGFyYW1zLmdldChcImxpbWl0XCIpIHx8IFwiMTBcIiwgMTApO1xuICBjb25zdCBmb2xkZXIgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImZvbGRlclwiKSB8fCBcInV0b3BpYXNcIjtcbiAgY29uc3QgY3Vyc29yID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJjdXJzb3JcIikgfHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0IHNvcnRQYXJhbSA9ICh1cmwuc2VhcmNoUGFyYW1zLmdldChcInNvcnRcIikgfHwgXCJhc2NcIikudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgc29ydE9yZGVyID0gc29ydFBhcmFtID09PSBcImRlc2NcIiA/IFwiZGVzY1wiIDogXCJhc2NcIjtcblxuICBjb25zdCBzZWFyY2hSYXcgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInNlYXJjaFwiKTtcbiAgY29uc3QgdGFncyA9IHBhcnNlU2VhcmNoVG9UYWdzKHNlYXJjaFJhdyk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBmb2xkZXJFeHByID0gYGZvbGRlcj1cIiR7ZXNjYXBlQ2xvdWRpbmFyeVZhbHVlKGZvbGRlcil9XCJgO1xuXG4gICAgY29uc3QgdGFnc0V4cHIgPVxuICAgICAgdGFncy5sZW5ndGggPiAwXG4gICAgICAgID8gYCBBTkQgKCR7dGFnc1xuICAgICAgICAgICAgLm1hcCgodCkgPT4gYHRhZ3M9XCIke2VzY2FwZUNsb3VkaW5hcnlWYWx1ZSh0KX1cImApXG4gICAgICAgICAgICAuam9pbihcIiBPUiBcIil9KWBcbiAgICAgICAgOiBcIlwiO1xuXG4gICAgY29uc3QgZXhwcmVzc2lvbiA9IGAke2ZvbGRlckV4cHJ9JHt0YWdzRXhwcn1gO1xuXG4gICAgbGV0IHEgPSBjbG91ZGluYXJ5LnNlYXJjaFxuICAgICAgLmV4cHJlc3Npb24oZXhwcmVzc2lvbilcbiAgICAgIC5zb3J0X2J5KFwiY3JlYXRlZF9hdFwiLCBzb3J0T3JkZXIpXG4gICAgICAud2l0aF9maWVsZChcImNvbnRleHRcIilcbiAgICAgIC53aXRoX2ZpZWxkKFwibWV0YWRhdGFcIilcbiAgICAgIC53aXRoX2ZpZWxkKFwidGFnc1wiKVxuICAgICAgLm1heF9yZXN1bHRzKGxpbWl0KTtcblxuICAgIGlmIChjdXJzb3IpIHEgPSBxLm5leHRfY3Vyc29yKGN1cnNvcik7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBxLmV4ZWN1dGUoKTtcblxuICAgIGNvbnN0IGl0ZW1zID0gKHJlcy5yZXNvdXJjZXMgfHwgW10pLm1hcCgocjogYW55KSA9PiB7XG4gICAgICAvLyBDbG91ZGluYXJ5IGNhbiByZXR1cm4gY29udGV4dCBhcyBlaXRoZXIgb2JqZWN0IG9yIHsgY3VzdG9tOiAuLi4gfVxuICAgICAgY29uc3QgY3ggPSByLmNvbnRleHQ/LmN1c3RvbSA/PyByLmNvbnRleHQgPz8ge307XG4gICAgICBjb25zdCBtZCA9IHIubWV0YWRhdGEgPz8ge307XG5cbiAgICAgIGNvbnN0IGFpVGl0bGUgPVxuICAgICAgICBwaWNrKGN4LCBcImFpVGl0bGVcIiwgXCJhaV90aXRsZVwiKSA/PyBwaWNrKG1kLCBcImFpVGl0bGVcIiwgXCJhaV90aXRsZVwiKTtcblxuICAgICAgY29uc3QgdGl0bGUgPVxuICAgICAgICBwaWNrKGN4LCBcImNhcHRpb25cIiwgXCJjYXB0aW9uXCIpID8/XG4gICAgICAgIHBpY2sobWQsIFwidGl0bGVcIiwgXCJ0aXRsZVwiKSA/P1xuICAgICAgICByLnB1YmxpY19pZD8uc3BsaXQoXCIvXCIpLnBvcCgpID8/XG4gICAgICAgIFwiVW50aXRsZWRcIjtcblxuICAgICAgY29uc3QgYWx0ID1cbiAgICAgICAgcGljayhjeCwgXCJhbHRcIiwgXCJhbHRcIikgPz8gcGljayhtZCwgXCJkZXNjcmlwdGlvblwiLCBcImRlc2NyaXB0aW9uXCIpO1xuXG4gICAgICAvLyDinIUgTkVXIGZpZWxkcyBmcm9tIGNvbnRleHRcbiAgICAgIGNvbnN0IHBhcmVudElkcyA9IHBpY2soY3gsIFwicGFyZW50SWRzXCIsIFwicGFyZW50SWRzXCIpOyAvLyBzdHJpbmdpZmllZCBKU09OIGluIHlvdXIgZXhhbXBsZVxuICAgICAgY29uc3QgYWlTdG9yeSA9XG4gICAgICAgIHBpY2soY3gsIFwiYWlTdG9yeVwiLCBcImFpX2V4dGVuZGVkX3N0b3J5XCIpID8/XG4gICAgICAgIHBpY2soY3gsIFwiYWlfZXh0ZW5kZWRfc3RvcnlcIiwgXCJhaV9leHRlbmRlZF9zdG9yeVwiKTtcbiAgICAgIGNvbnN0IGFpUG9saXRpY3MgPVxuICAgICAgICBwaWNrKGN4LCBcImFpUG9saXRpY3NcIiwgXCJhaV9wb2xpdGljYWxfc3RhdGVcIikgPz9cbiAgICAgICAgcGljayhjeCwgXCJhaV9wb2xpdGljYWxfc3RhdGVcIiwgXCJhaV9wb2xpdGljYWxfc3RhdGVcIik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiByLmFzc2V0X2lkID8/IHIucHVibGljX2lkLFxuICAgICAgICBwdWJsaWNfaWQ6IHIucHVibGljX2lkLFxuICAgICAgICB1cmw6IHIuc2VjdXJlX3VybCA/PyByLnVybCxcbiAgICAgICAgY3JlYXRlZF9hdDogci5jcmVhdGVkX2F0LFxuICAgICAgICB0YWdzOiByLnRhZ3MgPz8gW10sXG4gICAgICAgIHRpdGxlLFxuICAgICAgICBhaVRpdGxlLFxuICAgICAgICBhbHQsXG5cbiAgICAgICAgLy8g4pyFIGluY2x1ZGUgdGhlc2UgaW4gY2xpZW50IHBheWxvYWRcbiAgICAgICAgcGFyZW50SWRzLFxuICAgICAgICBhaVN0b3J5LCAvLyBjb3JyZXNwb25kcyB0byBhaV9leHRlbmRlZF9zdG9yeVxuICAgICAgICBhaVBvbGl0aWNzLCAvLyBjb3JyZXNwb25kcyB0byBhaV9wb2xpdGljYWxfc3RhdGVcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgaXRlbXMsXG4gICAgICBuZXh0Q3Vyc29yOiByZXMubmV4dF9jdXJzb3IgPz8gbnVsbCxcbiAgICAgIHNvcnRPcmRlcixcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiQ2xvdWRpbmFyeSBmZXRjaCBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgIHsgZXJyb3I6IFwiRmFpbGVkIHRvIGZldGNoIGltYWdlc1wiIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH0sXG4gICAgKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsInYyIiwiY2xvdWRpbmFyeSIsImNvbmZpZyIsImNsb3VkX25hbWUiLCJwcm9jZXNzIiwiZW52IiwiQ0xPVURJTkFSWV9DTE9VRF9OQU1FIiwiYXBpX2tleSIsIkNMT1VESU5BUllfQVBJX0tFWSIsImFwaV9zZWNyZXQiLCJDTE9VRElOQVJZX0FQSV9TRUNSRVQiLCJwaWNrIiwib2JqIiwia0NhbWVsIiwia1NuYWtlIiwiZXNjYXBlQ2xvdWRpbmFyeVZhbHVlIiwidiIsInJlcGxhY2UiLCJwYXJzZVNlYXJjaFRvVGFncyIsInJhdyIsInNwbGl0IiwibWFwIiwicyIsInRyaW0iLCJmaWx0ZXIiLCJCb29sZWFuIiwiR0VUIiwicmVxdWVzdCIsInVybCIsIlVSTCIsImxpbWl0IiwicGFyc2VJbnQiLCJzZWFyY2hQYXJhbXMiLCJnZXQiLCJmb2xkZXIiLCJjdXJzb3IiLCJ1bmRlZmluZWQiLCJzb3J0UGFyYW0iLCJ0b0xvd2VyQ2FzZSIsInNvcnRPcmRlciIsInNlYXJjaFJhdyIsInRhZ3MiLCJmb2xkZXJFeHByIiwidGFnc0V4cHIiLCJsZW5ndGgiLCJ0Iiwiam9pbiIsImV4cHJlc3Npb24iLCJxIiwic2VhcmNoIiwic29ydF9ieSIsIndpdGhfZmllbGQiLCJtYXhfcmVzdWx0cyIsIm5leHRfY3Vyc29yIiwicmVzIiwiZXhlY3V0ZSIsIml0ZW1zIiwicmVzb3VyY2VzIiwiciIsImN4IiwiY29udGV4dCIsImN1c3RvbSIsIm1kIiwibWV0YWRhdGEiLCJhaVRpdGxlIiwidGl0bGUiLCJwdWJsaWNfaWQiLCJwb3AiLCJhbHQiLCJwYXJlbnRJZHMiLCJhaVN0b3J5IiwiYWlQb2xpdGljcyIsImlkIiwiYXNzZXRfaWQiLCJzZWN1cmVfdXJsIiwiY3JlYXRlZF9hdCIsImpzb24iLCJuZXh0Q3Vyc29yIiwiZXJyb3IiLCJjb25zb2xlIiwic3RhdHVzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/cloudinary/recent/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/core-js","vendor-chunks/lodash","vendor-chunks/cloudinary","vendor-chunks/q","vendor-chunks/cloudinary-core"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fcloudinary%2Frecent%2Froute&page=%2Fapi%2Fcloudinary%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcloudinary%2Frecent%2Froute.ts&appDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CSynthesizingUtopias%5CutopiaAPI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();