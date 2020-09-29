import { Attribute, AttributeModel, HighPriorityAttributeModel } from '@neo-one/client-common';

export const attribute = (attrib: Attribute): AttributeModel => {
  switch (attrib.type) {
    default:
      return new HighPriorityAttributeModel();
  }
};
