using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace PadelWeb.Pages.Admin;

public class DashboardModel(IConfiguration config) : PageModel
{
    public string ApiUrl { get; private set; } = string.Empty;
    public void OnGet() => ApiUrl = config["ApiUrl"] ?? "http://localhost:5000";
}

public class TurnosModel(IConfiguration config) : PageModel
{
    public string ApiUrl { get; private set; } = string.Empty;
    public void OnGet() => ApiUrl = config["ApiUrl"] ?? "http://localhost:5000";
}

public class AlumnasModel(IConfiguration config) : PageModel
{
    public string ApiUrl { get; private set; } = string.Empty;
    public void OnGet() => ApiUrl = config["ApiUrl"] ?? "http://localhost:5000";
}

public class ReservasModel(IConfiguration config) : PageModel
{
    public string ApiUrl { get; private set; } = string.Empty;
    public string FechaHoy { get; private set; } = string.Empty;
    public void OnGet()
    {
        ApiUrl   = config["ApiUrl"] ?? "http://localhost:5000";
        FechaHoy = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");
    }
}

public class ConfigModel(IConfiguration config) : PageModel
{
    public string ApiUrl    { get; private set; } = string.Empty;
    public string ClubNombre { get; private set; } = string.Empty;
    public void OnGet()
    {
        ApiUrl     = config["ApiUrl"] ?? "http://localhost:5000";
        ClubNombre = config["ClubNombre"] ?? "Pádel Club";
    }
}

public class LoginModel(IConfiguration config) : PageModel
{
    [BindProperty] public string Usuario  { get; set; } = string.Empty;
    [BindProperty] public string Password { get; set; } = string.Empty;
    public string Error { get; private set; } = string.Empty;

    public IActionResult OnGet()
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToPage("/Admin/Dashboard");
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        var adminUser = config["Admin:Usuario"] ?? "admin";
        var adminPass = config["Admin:Password"] ?? "";

        if (Usuario != adminUser || Password != adminPass)
        {
            Error = "Usuario o contraseña incorrectos.";
            return Page();
        }

        var claims    = new List<Claim> { new(ClaimTypes.Name, Usuario), new(ClaimTypes.Role, "Admin") };
        var identity  = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        return RedirectToPage("/Admin/Dashboard");
    }
}

public class LogoutModel : PageModel
{
    public async Task<IActionResult> OnPostAsync()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToPage("/Admin/Login");
    }
}
