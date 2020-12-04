export const getMethodTemplate = `
        [Test, Order([[Order]])]
        public async Task [[TestName]]()
        {
            var expectedResponse = @"[[JSONResponseContent]]";
            JObject requestJsonObject = null;
            var apiUrl = "[[ApiUrl]]";
            [[DestinationDependencyLogic]]
            HttpResponseMessage responseMessage = await Client.GetAsync(apiUrl);

            Assert.IsTrue(responseMessage.IsSuccessStatusCode);

            SetCookies(responseMessage);
            [[SourceDependencyLogic]]

            if ([[AssertReponse]])
            {
              var actualResponse = await responseMessage.Content.ReadAsStringAsync();
              Assert.IsTrue(IsJsonEqual(actualResponse, expectedResponse));
            }
        }

`;
export const postMethodTemplate = `
        [Test, Order([[Order]])]
        public async Task [[TestName]]()
        {
            var requestJson = @"[[JSONRequestContent]]";
            var requestJsonObject = JObject.Parse(requestJson);

            var expectedResponse = @"[[JSONResponseContent]]";

            var apiUrl = "[[ApiUrl]]";
            [[DestinationDependencyLogic]]
            HttpResponseMessage responseMessage = await Client.PostAsync(apiUrl, new StringContent(requestJson, Encoding.UTF8, "application/json"));

            Assert.IsTrue(responseMessage.IsSuccessStatusCode);

            SetCookies(responseMessage);
            [[SourceDependencyLogic]]

            if ([[AssertReponse]])
            {
              var actualResponse = await responseMessage.Content.ReadAsStringAsync();
              Assert.IsTrue(IsJsonEqual(actualResponse, expectedResponse));
            }
        }
`;

export const sourceDependecyTemplate = `
            SetVariable(responseMessage, "[[SOURCE_TYPE]]", "[[SOURCE_PROP_NAME]]");
`;

export const destinationDependecyTemplate = `
            apiUrl = SetRequest(apiUrl, "[[DESTINATION_TYPE]]", "[[DESTINATION_PROP_NAME]]", "[[SOURCE_PROP_NAME]]", requestJsonObject);
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
        private Dictionary<string, string> dictionary = new Dictionary<string, string>();

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
            if (string.IsNullOrEmpty(expectedResponse) && string.IsNullOrEmpty(actualResponse))
                return true;

            if (string.IsNullOrEmpty(expectedResponse) || string.IsNullOrEmpty(actualResponse))
                return false;

            var expectedResponseObject = JToken.Parse(expectedResponse);
            var actualResponseObject = JToken.Parse(actualResponse);
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

        private void SetVariable(HttpResponseMessage responseMessage, string sourceType, string propName)
        {
            switch (sourceType)
            {
                case "HEADER": SetFromHeader(responseMessage, propName); break;
                case "CONTENT": SetFromContent(responseMessage, propName); break;
                case "COOKIE": SetFromCookies(responseMessage, propName); break;
            }
        }

        private void SetFromHeader(HttpResponseMessage responseMessage, string propName)
        {
            dictionary.Add(propName, responseMessage.Headers.GetValues(propName).ToString());
        }
        private void SetFromCookies(HttpResponseMessage responseMessage, string propName)
        {
            foreach (Cookie cookie in cookies.GetCookies(Client.BaseAddress))
            {
                if (cookie.Name == propName)
                {
                    dictionary.Add(propName, cookie.Value);
                }
            }
        }
        private void SetFromContent(HttpResponseMessage responseMessage, string propName)
        {
            var something = responseMessage.Content.ReadAsStringAsync();
            var jObject = JObject.Parse(something.Result);
            string res = null;
            var propList = propName.Split('.');
            for (int i = 0; i < propList.Length; i++)
            {
                var val = jObject.GetValue(propList[i]);
                if (i == (propList.Length - 1))
                {
                    res = val.ToString();
                }
            }
            dictionary[propName] = res;
        }


        private string SetRequest(string apiUrl, string destinationType, string propName, string varName, JObject requestMessage = null)
        {
            switch (destinationType)
            {
                case "HEADER": SetToHeader(propName, varName); break;
                case "CONTENT": SetToContent(apiUrl, propName, varName, requestMessage); break;
                case "COOKIES": break;
                case "QUERY_PARAMS": apiUrl = SetToQueryParams(apiUrl, propName, varName); break;
            }

            return apiUrl;
        }
        private void SetToHeader(string propName, string varName)
        {
          if (dictionary.ContainsKey(varName))
          {
              if (Client.DefaultRequestHeaders.Contains(propName))
                  Client.DefaultRequestHeaders.Remove(propName);
              Client.DefaultRequestHeaders.Add(propName, dictionary[varName]);
          }
        }

        private void SetToContent(string apiUrl, string propName, string varName, JObject requestObject)
        {
            requestObject[propName] = dictionary[varName];
        }
        private string SetToQueryParams(string apiUrl, string propName, string varName)
        {
            string urlPart, qsPart = string.Empty;

            var urlSplit = apiUrl.Split('?');
            urlPart = urlSplit[0];

            if (urlSplit.Length > 1)
                qsPart = urlSplit[1];
            if (string.IsNullOrWhiteSpace(qsPart))
            {
                qsPart = propName + "=" + dictionary[varName];
            }
            else
            {
                var queryParams = qsPart.Split('&');
                for (int i = 0; i < queryParams.Length; i++)
                {
                    var qs = queryParams[i].Split('=');
                    if (string.Equals(qs[0], propName, StringComparison.InvariantCultureIgnoreCase))
                    {
                        queryParams[i] = propName + "=" + dictionary[varName];
                        break;
                    }
                }
                qsPart = String.Join('&', queryParams);
            }
            apiUrl = urlPart + '?' + qsPart;
            return apiUrl;
        }

    }
}
`;
