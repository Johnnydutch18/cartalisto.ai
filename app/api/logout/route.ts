[{
	"resource": "/workspaces/cartalisto.ai/app/api/logout/route.ts",
	"owner": "typescript",
	"code": "2769",
	"severity": 8,
	"message": "No overload matches this call.\n  Overload 1 of 2, '(supabaseUrl: string, supabaseKey: string, options: SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServerDeprecated; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }): SupabaseClient<...>', gave the following error.\n    Property 'get' is missing in type 'Promise<ReadonlyRequestCookies>' but required in type 'CookieMethodsServerDeprecated'.\n  Overload 2 of 2, '(supabaseUrl: string, supabaseKey: string, options: SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServer; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }): SupabaseClient<...>', gave the following error.\n    Property 'getAll' is missing in type 'Promise<ReadonlyRequestCookies>' but required in type 'CookieMethodsServer'.",
	"source": "ts",
	"startLineNumber": 10,
	"startColumn": 7,
	"endLineNumber": 10,
	"endColumn": 14,
	"relatedInformation": [
		{
			"startLineNumber": 31,
			"startColumn": 5,
			"endLineNumber": 31,
			"endColumn": 8,
			"message": "'get' is declared here.",
			"resource": "/workspaces/cartalisto.ai/node_modules/.pnpm/@supabase+ssr@0.6.1_@supabase+supabase-js@2.50.2/node_modules/@supabase/ssr/dist/main/types.d.ts"
		},
		{
			"startLineNumber": 11,
			"startColumn": 5,
			"endLineNumber": 11,
			"endColumn": 12,
			"message": "The expected type comes from property 'cookies' which is declared here on type 'SupabaseClientOptions<\"public\"> & { cookieOptions?: CookieOptionsWithName | undefined; cookies: CookieMethodsServerDeprecated; cookieEncoding?: \"raw\" | ... 1 more ... | undefined; }'",
			"resource": "/workspaces/cartalisto.ai/node_modules/.pnpm/@supabase+ssr@0.6.1_@supabase+supabase-js@2.50.2/node_modules/@supabase/ssr/dist/main/createServerClient.d.ts"
		},
		{
			"startLineNumber": 36,
			"startColumn": 5,
			"endLineNumber": 36,
			"endColumn": 11,
			"message": "'getAll' is declared here.",
			"resource": "/workspaces/cartalisto.ai/node_modules/.pnpm/@supabase+ssr@0.6.1_@supabase+supabase-js@2.50.2/node_modules/@supabase/ssr/dist/main/types.d.ts"
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
}]