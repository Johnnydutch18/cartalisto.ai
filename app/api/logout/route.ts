[{
	"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts",
	"owner": "typescript",
	"code": "2769",
	"severity": 8,
	"message": "No overload matches this call.\n  Overload 1 of 2, '(supabaseUrl: string, supabaseKey: string, options: SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServerDeprecated; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }): SupabaseClient<...>', gave the following error.\n    Object literal may only specify known properties, and 'delete' does not exist in type 'CookieMethodsServerDeprecated'.\n  Overload 2 of 2, '(supabaseUrl: string, supabaseKey: string, options: SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServer; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }): SupabaseClient<...>', gave the following error.\n    Object literal may only specify known properties, and 'get' does not exist in type 'CookieMethodsServer'.",
	"source": "ts",
	"startLineNumber": 9,
	"startColumn": 22,
	"endLineNumber": 9,
	"endColumn": 40,
	"relatedInformation": [
		{
			"startLineNumber": 11,
			"startColumn": 5,
			"endLineNumber": 11,
			"endColumn": 12,
			"message": "The expected type comes from property 'cookies' which is declared here on type 'SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServerDeprecated; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }'",
			"resource": "/workspaces/cartalisto.ai/node_modules/.pnpm/@supabase+ssr@0.6.1_@supabase+supabase-js@2.50.2/node_modules/@supabase/ssr/dist/main/createServerClient.d.ts"
		},
		{
			"startLineNumber": 77,
			"startColumn": 5,
			"endLineNumber": 77,
			"endColumn": 12,
			"message": "The expected type comes from property 'cookies' which is declared here on type 'SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServer; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }'",
			"resource": "/workspaces/cartalisto.ai/node_modules/.pnpm/@supabase+ssr@0.6.1_@supabase+supabase-js@2.50.2/node_modules/@supabase/ssr/dist/main/createServerClient.d.ts"
		}
	]
},{
	"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'.",
	"source": "ts",
	"startLineNumber": 14,
	"startColumn": 46,
	"endLineNumber": 14,
	"endColumn": 49,
	"relatedInformation": [
		{
			"startLineNumber": 14,
			"startColumn": 46,
			"endLineNumber": 14,
			"endColumn": 49,
			"message": "Did you forget to use 'await'?",
			"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts"
		}
	]
},{
	"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'set' does not exist on type 'Promise<ReadonlyRequestCookies>'.",
	"source": "ts",
	"startLineNumber": 16,
	"startColumn": 25,
	"endLineNumber": 16,
	"endColumn": 28,
	"relatedInformation": [
		{
			"startLineNumber": 16,
			"startColumn": 25,
			"endLineNumber": 16,
			"endColumn": 28,
			"message": "Did you forget to use 'await'?",
			"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts"
		}
	]
},{
	"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'delete' does not exist on type 'Promise<ReadonlyRequestCookies>'.",
	"source": "ts",
	"startLineNumber": 19,
	"startColumn": 25,
	"endLineNumber": 19,
	"endColumn": 31,
	"relatedInformation": [
		{
			"startLineNumber": 19,
			"startColumn": 25,
			"endLineNumber": 19,
			"endColumn": 31,
			"message": "Did you forget to use 'await'?",
			"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts"
		}
	]
}]