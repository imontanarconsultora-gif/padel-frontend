using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.LoginPath        = "/Admin/Login";
        o.AccessDeniedPath = "/Admin/Login";
        o.Cookie.HttpOnly  = true;
        o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        o.ExpireTimeSpan   = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
    });

builder.Services.AddRazorPages(o =>
{
    o.Conventions.AuthorizeFolder("/Admin");
    o.Conventions.AllowAnonymousToPage("/Admin/Login");
    o.Conventions.AllowAnonymousToPage("/Admin/Logout");
});

builder.Services.AddHttpClient("PadelApi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiUrl"] ?? "http://localhost:5000");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(90); // Render free tier puede tardar hasta 60s en despertar
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// ── PROXY TRANSPARENTE ─────────────────────────────────────────
// El JS llama a /api/... en este servidor; lo reenviamos al backend.
// Así nunca hay preflight CORS porque el browser siempre habla con
// el mismo origen que la página.
app.Map("/api/{**catchAll}", async (HttpContext ctx, IHttpClientFactory factory, IConfiguration config) =>
{
    var apiBase = (config["ApiUrl"] ?? "http://localhost:5000").TrimEnd('/');
    var target  = apiBase + ctx.Request.Path + ctx.Request.QueryString;

    var req = new HttpRequestMessage(new HttpMethod(ctx.Request.Method), target);

    if (ctx.Request.Method is "POST" or "PUT" or "PATCH")
    {
        req.Content = new StreamContent(ctx.Request.Body);
        req.Content.Headers.TryAddWithoutValidation(
            "Content-Type", ctx.Request.ContentType ?? "application/json");
    }

    try
    {
        var client = factory.CreateClient("PadelApi");
        var res    = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);

        ctx.Response.StatusCode = (int)res.StatusCode;
        if (res.Content.Headers.ContentType?.ToString() is { } ct)
            ctx.Response.ContentType = ct;

        await res.Content.CopyToAsync(ctx.Response.Body);
    }
    catch (TaskCanceledException)
    {
        ctx.Response.StatusCode  = 504;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync("{\"mensaje\":\"El servidor tardó demasiado en responder. Puede estar iniciando, intentá de nuevo en unos segundos.\"}");
    }
    catch (HttpRequestException)
    {
        ctx.Response.StatusCode  = 502;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync("{\"mensaje\":\"No se pudo conectar al servidor backend. Verificá que el servicio esté activo.\"}");
    }
});

app.MapRazorPages();
app.Run();
