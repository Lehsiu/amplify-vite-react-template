declare module "@aws-amplify/backend" {
    export const a: any;
    export const defineData: any;
    export const a: {
        schema: (schemaDefinition: any) => any;
        model: (modelDefinition: any) => any;
        string: () => any;
        boolean: () => any;
      };
      export function defineData(config: any): any;
      export type ClientSchema = any;
  }