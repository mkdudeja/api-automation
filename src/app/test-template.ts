export const getMethodTemplate = `
        [Test, Order([[Order]])]
        public async Task [[TestName]]()
        {
            var expectedResponse = @"[[JSONResponseContent]]";

            Client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpResponseMessage responseMessage = await Client.GetAsync("[[ApiUrl]]");

            Assert.IsTrue(responseMessage.IsSuccessStatusCode);
            var actualResponse = await responseMessage.Content.ReadAsStringAsync();
            Assert.IsTrue(IsJsonStructureSame(actualResponse, expectedResponse));
            SetCookies(responseMessage);
        }

`;
export const postMethodTemplate = `
        [Test, Order([[Order]])]
        public async Task [[TestName]]()
        {
            var requestJson = @"[[JSONRequestContent]]";

            var expectedResponse = @"[[JSONResponseContent]]";

            Client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpResponseMessage responseMessage = await Client.PostAsync("[[ApiUrl]]" , new StringContent(requestJson, Encoding.UTF8, "application/json"));

            Assert.IsTrue(responseMessage.IsSuccessStatusCode);
            var actualResponse = await responseMessage.Content.ReadAsStringAsync();
            Assert.IsTrue(IsJsonStructureSame(actualResponse, expectedResponse));
            SetCookies(responseMessage);
        }
`;

export const testClassTemplate = `using NUnit.Framework;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace ApiTests
{

    public class AutoApiTestClass
    {
        private HttpClient Client;
        private CookieContainer cookies = new CookieContainer();
        private HttpClientHandler handler;
        private string hostUrl = "[[HostUrl]]";

        public AutoApiTestClass()
        {
            handler = new HttpClientHandler
            {   CookieContainer = cookies,
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
            Client = new HttpClient(handler)
            {
                BaseAddress = new Uri(hostUrl)
            };

            Client.DefaultRequestHeaders.Accept.Clear();
            Client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        [SetUp]
        public void Setup()
        {

        }

        [[TEST_CASES]]

        private bool IsJsonStructureSame(string expectedResponse, string actualResponse)
        {
            JObject expectedResponseObject = JObject.Parse(actualResponse);
            JObject actualResponseObject = JObject.Parse(actualResponse);
            return JToken.DeepEquals(actualResponseObject, expectedResponseObject);
        }

        private string SetSessionId(string uri)
        {
            Uri urid = new Uri(hostUrl);
            var s = cookies.GetCookies(urid);
            string sessionId = s[0].Value;

            if (uri.IndexOf('?') > -1)
            {
                return uri += "&sessionId=" + sessionId;
            }
            else
            {
                return uri += "?sessionId=" + sessionId;
            }
        }

        private void SetCookies(HttpResponseMessage responseMessage)
        {
            IEnumerable<string> cookies = responseMessage.Headers.SingleOrDefault(header => header.Key == "Set-Cookie").Value;
            Uri urid = new Uri(hostUrl);
            if (cookies != null)
            {
                cookies.ToList().ForEach(cookie =>
                {
                    this.cookies.SetCookies(urid, cookie);
                });
            }
        }

    }
}
`;
