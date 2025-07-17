import fetch from "node-fetch";

const credential = {
  credentialSubject: {
    memberOf: "Decentralized Identity Foundation",
    id: "did:ethr:0x03b2860e39a808df9da8786edd8503c63a48a782aba06e5a4882317d1f252f7446",
  },
  issuer: { id: "did:web:identity.foundation:cte-demo:sample_dids:sample_org" },
  type: ["VerifiableCredential", "DIFMemberIndividual"],
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://veramo.io/contexts/profile/v1",
  ],
  issuanceDate: "2024-07-04T20:03:55.000Z",
  proof: {
    type: "JwtProof2020",
    jwt: "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vdmVyYW1vLmlvL2NvbnRleHRzL3Byb2ZpbGUvdjEiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkRJRk1lbWJlckluZGl2aWR1YWwiXSwiY3JlZGVudGlhbFN1YmplY3QiOnsibWVtYmVyT2YiOiJEZWNlbnRyYWxpemVkIElkZW50aXR5IEZvdW5kYXRpb24ifX0sInN1YiI6ImRpZDpldGhyOjB4MDNiMjg2MGUzOWE4MDhkZjlkYTg3ODZlZGQ4NTAzYzYzYTQ4YTc4MmFiYTA2ZTVhNDg4MjMxN2QxZjI1MmY3NDQ2IiwibmJmIjoxNzIwMTIzNDM1LCJpc3MiOiJkaWQ6d2ViOmlkZW50aXR5LmZvdW5kYXRpb246Y3RlLWRlbW86c2FtcGxlX2RpZHM6c2FtcGxlX29yZyJ9.2SXnsWqh0hRarTO_KJ6Jz6HOFKIiBqv1v4WERZIhtKleQVGqn-V2-MLOvpiYDUC-1jr5Lj6ZOOj8jKyEyul2Ng",
  },
};

const trustRegistryUrl =
  "https://raw.githubusercontent.com/decentralized-identity/cte-demo/main/sample_governance/dif_governance.json";

// our internal mapping of types; replace as needed
const credentialTypeMap = {
  DIFMemberIndividual:
    "uri:example:4CLG5pU5v294VdkMWxSByu:2:DIFMemberIndividual:1.0",
  DIFMemberOrganization:
    "uri:example:RuuJwd3JMffNwZ43DcJKN1:2:DIFMemberOrganization:1.4",
};

async function fetchTrustRegistry() {
  const response = await fetch(trustRegistryUrl);
  const trustRegistry = await response.json();
  return trustRegistry;
}

// Function to check if the issuer is authorized in the trust registry
function checkIssuerAuthorization(trustRegistry, issuerDid, credentialType) {
  const issuerEntry =
    trustRegistry.participants.entries[
      "https://identity.foundation/roles.schema.json"
    ][issuerDid];

  if (!issuerEntry) {
    return false;
  }

  // Check if the issuer has the correct role to issue the credential
  const roles = trustRegistry.roles[issuerEntry.role];
  const mappedCredentialType = credentialTypeMap[credentialType];
  if (!roles || !roles.issue.includes(mappedCredentialType)) {
    return false;
  }

  return true;
}

async function verifyCredential(credential) {
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
verifyCredential(credential)
  .then((result) => {
    console.log("Credential verification result:", result);
  })
  .catch((error) => {
    console.error("Error verifying credential:", error);
  });
