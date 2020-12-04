export const GETMETHODTEMPLATE = `
        [Test, Order([[Order]])]
        public async Task [[TestName]]()
        {
            var expectedResponse = @"[[JSONResponseContent]]";

            var apiUrl = "[[ApiUrl]]";
            [[DestinationDependencyLogic]]
            Client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpResponseMessage responseMessage = await Client.GetAsync(apiUrl);

            Assert.IsTrue(responseMessage.IsSuccessStatusCode);
            var actualResponse = await responseMessage.Content.ReadAsStringAsync();
            Assert.IsTrue(IsJsonEqual(actualResponse, expectedResponse));
            SetCookies(responseMessage);
            [[SourceDependencyLogic]]
        }

`;
export const POSTMETHODTEMPLATE = `
        [Test, Order([[Order]])]
        public async Task [[TestName]]()
        {
            var requestJson = @"[[JSONRequestContent]]";

            var expectedResponse = @"[[JSONResponseContent]]";

            var apiUrl = "[[ApiUrl]]";
            [[DestinationDependencyLogic]]
            Client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpResponseMessage responseMessage = await Client.PostAsync(apiUrl, new StringContent(requestJson, Encoding.UTF8, "application/json"));

            Assert.IsTrue(responseMessage.IsSuccessStatusCode);
            var actualResponse = await responseMessage.Content.ReadAsStringAsync();
            Assert.IsTrue(IsJsonEqual(actualResponse, expectedResponse));
            SetCookies(responseMessage);
            [[SourceDependencyLogic]]
        }
`;

export const SOURCEDEPENDECYTEMPLATE = `
            SetVariable(responseMessage, "[[SOURCE_TYPE]]", "[[SOURCE_PROP_NAME]]");
`;

export const DESTINATIONDEPENDECYTEMPLATE = `
            apiUrl = SetRequest(apiUrl, "[[DESTINATION_TYPE]]", "[[DESTINATION_PROP_NAME]]", "[[SOURCE_PROP_NAME]]");
`;

export const TESTCLASSTEMPLATE = `using NUnit.Framework;
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

        private bool IsJsonEqual(string expectedResponse, string actualResponse)
        {
            JObject expectedResponseObject = JObject.Parse(expectedResponse);
            JObject actualResponseObject = JObject.Parse(actualResponse);
            return JToken.DeepEquals(actualResponseObject, expectedResponseObject);
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

        private string SetRequest(string apiUrl, string type, string destinationPropName, string sourceVariableName)
        {
            return apiUrl;
        }

        private void SetVariable(HttpResponseMessage response, string type, string propName)
        {

        }

    }
}
`;
