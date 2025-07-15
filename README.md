# DIF Member Credentials and Credential Trust Establishment

## Overview

This guide demonstrates how to set up an end-to-end example of a Credential Trust Establishment (CTE) trust registry and issuing membership credentials for the Decentralized Identity Foundation (DIF). In this scenario, DIF issues credentials to its members, and members can subsequently issue credentials to individuals. This tutorial utilizes the Veramo framework for managing DIDs (Decentralized Identifiers) and issuing Verifiable Credentials, but you may use any tool you like.

## Context

The [CTE specification](https://identity.foundation/credential-trust-establishment/) includes an example in which the Decentralized Identity Foundation issues credentials to its members (organizations), who in turn issue credentials to their employees. This allows DIF to automatically check which participants are eligible to attend member-only events.

In brief, the flow is:

- The DIF is the root of trust, who authorizes members
- Member organizations authorize individuals to represent them
- Individuals receive a membership credential from either the organization they represent or from the DIF directly.
- 
<img width="619" height="311" alt="Overview of flow" src="https://github.com/user-attachments/assets/c5a767d9-01d1-430d-8a18-b70f611ee0e6" />

The resulting trust registry example is shown in the CTE specification. This repository shows code samples in support of that example, including:

1. Sample DID documents in `sample_dids`
2. Sample trust registry in `sample_governance`
3. Example steps to issue membership VCs (see tutorial below)
4. Sample code to verify VCs issued as above in `verify-cte`

## Prerequisites

Ensure you have the Veramo CLI installed and properly configured. Refer to the [Veramo CLI documentation](https://veramo.io/docs/veramo_agent/cli_tool) for installation and configuration instructions and details about the commands below.

## Steps for Setting Up the Trust Registry

### 0. Prerequisite: Setting Up DIDs and Keys

#### Create a DID for DIF

We'll assume that DIF uses `did:web`.

```bash
veramo did create
```

In our sample, we used the following selections:

```bash
? Select identifier provider did:web
? Select key management system local
? Enter alias identity.foundation:demos:sample_dids:dif
```

Resulting in the following output:

```
┌──────────┬───────────────────────────────────────────┬───────────────────────────────────────────────────┐
│ provider │                                     alias │                                               did │
├──────────┼───────────────────────────────────────────┼───────────────────────────────────────────────────┤
│  did:web │ identity.foundation:demos:sample_dids:dif │ did:web:identity.foundation:demos:sample_dids:dif │
└──────────┴───────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

#### Add a Key to the DID

```bash
veramo did add-key
```

Make these selections:

```bash
? Select DID did:web:identity.foundation:demos:sample_dids:dif
? Select key management system local
? Type Ed25519
```

Expected output:

```bash
Success: { success: true }
```

#### Retrieve and Upload DID Document

```bash
curl -o did.json -H "Host: identity.foundation" http://localhost:3332/demos/sample_dids/dif/did.json
```

This resulted in [DIF's sample did.json, uploaded here](https://github.com/decentralized-identity/demos/blob/main/sample_dids/dif/did.json).

#### Repeat for Sample Organization

Repeat the above steps to create a DID for a member organization, resulting in [Sample Org's did.json file](https://github.com/decentralized-identity/demos/blob/main/sample_dids/sample_org/did.json).

#### Repeat for the Organization's Employee

Repeat the above steps, but this time, we'll use `did:ethr`. You may use any DID method you like, but it's helpful to keep in mind that you can use different DID methods.

### 1. Set Up the Trust Registry

A trust registry defines the roles and rules for credential issuance within the ecosystem. Adapting the [Credential Trust Establishment](https://identity.foundation/credential-trust-establishment/) example to use our DIDs created above results in the following `participants`; note that we're re-using `schemas` and `roles` from that example:

```json
{
  "participants": {
    ...
    "entries": {
      "https://identity.foundation/description.schema.json": {
        "did:web:identity.foundation:demos:sample_dids:dif": {
          "name": "Decentralized Identity Foundation",
          "website": "https://identity.foundation/",
          "email": "membership@identity.foundation"
        },
        "did:web:identity.foundation:demos:sample_dids:sample_org": {
          "

name": "Sample Organization",
          "website": "https://example.com/",
          "email": "contact@example.com"
        }
      },
      "https://identity.foundation/roles.schema.json": {
        "did:web:identity.foundation:demos:sample_dids:dif": [
          {
            "start": "2024-06-21T23:12:19Z",
            "role": "dif"
          }
        ],
        "did:web:identity.foundation:demos:sample_dids:sample_org": {
          "start": "2024-06-21T23:12:19Z",
          "role": "dif_member_organization"
        }
      }
    }
  }
}
```

[See the resulting governance file.](https://raw.githubusercontent.com/decentralized-identity/demos/main/sample_governance/dif_governance.json)

### 2. Issue Credentials

#### Issue a Credential from DIF to a Member Organization

```bash
veramo credential create
? Credential proofFormat lds
? Issuer DID did:web:identity.foundation:demos:sample_dids:dif
? Subject DID did:web:identity.foundation:demos:sample_dids:sample_org
? Credential Type VerifiableCredential,DIFMemberOrganization
? Claim Type memberOf
? Claim Value Decentralized Identity Foundation
```

Expected output:

```json
{
  "issuer": { "id": "did:web:identity.foundation:demos:sample_dids:dif" },
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://veramo.io/contexts/profile/v1"
  ],
  "type": ["VerifiableCredential", "DIFMemberOrganization"],
  "issuanceDate": "2024-06-21T22:25:26.615Z",
  "credentialSubject": {
    "id": "did:web:identity.foundation:demos:sample_dids:sample_org",
    "memberOf": "Decentralized Identity Foundation"
  },
  "proof": {
    "type": "Ed25519Signature2018",
    "created": "2024-06-21T22:25:26Z",
    "verificationMethod": "did:web:identity.foundation:demos:sample_dids:dif#dc0a72e06d626576d2ec2b6c00029795ea2d3f89ac7087389e7c4da38f65768e",
    "proofPurpose": "assertionMethod",
    "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..3cahb3pmoc9JlqFeFdMH8G2MhzFfY3V20DMh6D-fyCcZWo7P07IheeE9WuQRB48hgtEJ38rPudhz25rYWecEAA"
  }
}
```

#### Issue a Credential from a Member Organization to an Individual

Create a DID for the individual:

```bash
veramo did create
? Select identifier provider did:ethr
? Select key management system local
? Enter alias sample employee
```

Expected output:

```text
┌──────────┬─────────────────┬───────────────────────────────────────────────────────────────────────────────┐
│ provider │           alias │                                                                           did │
├──────────┼─────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ did:ethr │ sample employee │ did:ethr:0x0232c23a85049404480dac15519bfc74d36b2f6afad1dff7400fb2d09b6423c7fc │
└──────────┴─────────────────┴───────────────────────────────────────────────────────────────────────────────┘
```

Issue the credential:

```bash
veramo credential create
? Credential proofFormat jwt
? Issuer DID did:web:identity.foundation:demos:sample_dids:sample_org
? Subject DID did:ethr:0x0232c23a85049404480dac15519bfc74d36b2f6afad1dff7400fb2d09b6423c7fc
```

### 3. Verify Credentials

Verification of issued credentials is crucial to ensure their authenticity and validity. Using Veramo, you can verify credentials easily.

#### Verify a Credential

Supposing an individual has a `DIFMemberIndividual` credential, at verification time, DIF's verification would perform the usual verification a la:

```bash
veramo credential verify
```

But would also modify to also check that the issuer of the credential is listed in the trust registry. This involves checking that the issuer's DID is present in the trust registry and that they have the appropriate roles and permissions to issue the specific type of credential being verified. Here is an example of how you can incorporate this check into your verification logic:

1. **Retrieve Trust Registry**: Fetch the trust registry to get the list of authorized issuers.
2. **Check Issuer Authorization**: Ensure the issuer's DID is listed in the trust registry with the correct role.

Example Pseudocode:

```javascript
async function verifyCredential(credential) {
  // Fetch the trust registry
  const trustRegistry = await fetchTrustRegistry();

  // Extract issuer DID from the credential
  const issuerDid = credential.issuer.id;

  // Check if the issuer is authorized in the trust registry
  const isAuthorized = checkIssuerAuthorization(trustRegistry, issuerDid);

  if (!isAuthorized) {
    throw new Error("Issuer is not authorized in the trust registry");
  }

  // Proceed with standard Veramo credential verification
  const verificationResult = await veramo.verifyCredential({ credential });
  return verificationResult;
}

function checkIssuerAuthorization(trustRegistry, issuerDid) {
  // Implement logic to check if the issuer DID is listed in the trust registry
  // and has the appropriate roles and permissions
  return trustRegistry.participants.entries[issuerDid] !== undefined;
}
```

Here is an example implementation of the verification logic in JavaScript:

```javascript
const fetch = require("node-fetch");

// Function to fetch the trust registry
async function fetchTrustRegistry() {
  const response = await fetch(
    "https://identity.foundation/credential-trust-establishment/trust-registry.json"
  );
  const trustRegistry = await response.json();
  return trustRegistry;
}

// Function to check if the issuer is authorized in the trust registry
function checkIssuerAuthorization(trustRegistry, issuerDid, credentialType) {
  const issuerEntry = trustRegistry.participants.entries[issuerDid];

  if (!issuerEntry) {
    return false;
  }

  // Check if the issuer has the correct role to issue the credential
  const roles = trustRegistry.roles[issuerEntry.role];
  if (!roles || !roles.issue.includes(credentialType)) {
    return false;
  }

  return true;
}

// Function to verify the credential
async function verifyCredential(credential) {
  // Fetch the trust registry
  const trustRegistry = await fetchTrustRegistry();

  // Extract issuer DID and credential type from the credential
  const issuerDid = credential.issuer.id;
  const credentialType = credential.type[1]; // Assuming the second type is the specific credential type

  // Check if the issuer is authorized in the trust registry
  const isAuthorized = checkIssuerAuthorization(
    trustRegistry,
    issuerDid,
    credentialType
  );

  if (!isAuthorized) {
    throw new Error("Issuer is not authorized in the trust registry");
  }

  // Proceed with standard Veramo credential verification
  const verificationResult = await veramo.verifyCredential({ credential });
  return verificationResult;
}

// Example usage
const credential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://veramo.io/contexts/profile/v1",
  ],
  type: ["VerifiableCredential", "EmployeeCredential"],
  issuer: {
    id: "did:web:identity.foundation:demos:sample_dids:company",
  },
  issuanceDate: "2024-06-21T22:32:02.000Z",
  credentialSubject: {
    id: "did:ethr:0x0232c23a85049404480dac15519bfc74d36b2f6afad1dff7400fb2d09b6423c7fc",
    employeeOf: "Sample Company",
  },
  proof: {
    type: "JwtProof2020",
    jwt: "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vdmVyYW1vLmlvL2NvbnRleHRzL3Byb2ZpbGUvdjEiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkVtcGxveWVlQ3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJlbXBsb3llZU9mIjoiU2FtcGxlIENvbXBhbnkifX0sInN1YiI6ImRpZDpldGhyOjB4MDIzMmMyM2E

4NTA0OTQwNDQ4MGRhYzE1NTE5YmZjNzRkMzZiMmY2YWZhZDFkZmY3NDAwZmIyZDA5YjY0MjNjN2ZjIiwibmJmIjoxNzE5MDA5MTIyLCJpc3MiOiJkaWQ6d2ViOmlkZW50aXR5LmZvdW5kYXRpb246ZGVtb3M6c2FtcGxlX2RpZHM6c2FtcGxlX29yZyJ9.lhDIDDbe-Uf3UcyStnxYgoZjKybWI4OswjeIGuXeBNs6HG8RU4ysGXPU_IoJYr_StpRciCF0VjywHxTVxbnZBw",
  },
};

verifyCredential(credential)
  .then((result) => {
    console.log("Credential verification result:", result);
  })
  .catch((error) => {
    console.error("Error verifying credential:", error);
  });
```

### Explanation

1. **fetchTrustRegistry**: This function fetches the trust registry from a specified URL. The URL used here is hypothetical and should be replaced with the actual URL of your trust registry.

2. **checkIssuerAuthorization**: This function checks if the issuer's DID is listed in the trust registry and if they have the appropriate role to issue the specific type of credential.

3. **verifyCredential**: This function performs the credential verification process. It first fetches the trust registry and checks if the issuer is authorized. If the issuer is not authorized, it throws an error. Otherwise, it proceeds with the standard Veramo credential verification.

By incorporating this logic, you can ensure that only trusted issuers listed in the trust registry are authorized to issue credentials, enhancing the security and trustworthiness of your decentralized identity ecosystem.
