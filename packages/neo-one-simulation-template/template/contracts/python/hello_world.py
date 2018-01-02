from boa.blockchain.vm.Neo.Runtime import Notify

def Main(operation, args):
    """

    :param operation: str The name of the operation to perform
    :param args: list A list of arguments along with the operation
    :return:
        bytearray: The result of the operation
    """


    if operation != None:

        if operation == 'hello':
            arg = args[0]
            print('Hello ' + arg)
            return True

    return False
