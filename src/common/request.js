import { GraphQLClient } from 'graphql-request'

const endpoint = "http://47.244.97.208:8080/query"

let gql = async (param, variables) => {
  /* request */
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
    },
    mode: 'cors'
  })
  let data = await graphQLClient
    .request(param, variables)
    .then(res => {
      return res
    })
    .catch(err => {
      return err.response
    })

  if (data.errors && data.errors[0].message === 'credentials error') {
    window.location.hash = '#/'
  } else {
    return data
  }
}

export { gql }
