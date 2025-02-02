using Microsoft.Extensions.DependencyInjection;
using NotepadPlusApi.Services;

namespace NotepadPlusApi
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddScoped<IFolderService, FolderService>();
        }
    }
} 