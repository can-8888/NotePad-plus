using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace NotepadPlusApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ILogger<HealthController> _logger;

        public HealthController(ILogger<HealthController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<string> Get()
        {
            _logger.LogInformation("Health check endpoint hit");
            return Ok("API is running");
        }
    }
} 