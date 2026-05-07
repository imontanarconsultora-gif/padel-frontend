using Microsoft.AspNetCore.Mvc.RazorPages;

namespace PadelWeb.Pages;

public class IndexModel(IConfiguration config) : PageModel
{
    public string ApiUrl { get; private set; } = string.Empty;

    public void OnGet()
    {
        ApiUrl = config["ApiUrl"] ?? "http://localhost:5000";
    }
}
